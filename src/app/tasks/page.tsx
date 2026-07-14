"use client";

/** 📋 任务中心 v3 — 3Tab统一架构（每日任务+成就墙+挑战签到） */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { API_BASE, apiFetch } from "@/config/api";
import { ErrorState } from "@/components/layout/error-state";
import LoginModal from "@/components/ui/login-modal";

/* ═══════════════════════ Tab 配置 ═══════════════════════ */
const TABS = [
  { id: "daily",   label: "每日任务", icon: "📋" },
  { id: "achieve", label: "成就墙",   icon: "🏆" },
  { id: "challenge", label: "挑战签到", icon: "🎯" },
];

/* ═══════════════════════ 类型定义 ═══════════════════════ */
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

interface AchievementDef {
  id: string; icon: string; name: string; desc: string;
  reward: string; rewardVal: number; rewardType: string; category: string;
  check: (data: any) => { done: boolean; progress: number; max: number; label: string };
}

interface SignStatus {
  signed_today: boolean; current_streak: number; today_reward: number;
  next_reward: number; streak_records: { date: string; streak: number; reward: number }[];
}

/* ═══════════════════════ 成就定义 ═══════════════════════ */
const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_bet", icon: "🥉", name: "首战告捷", desc: "完成第一次预测", reward: "500🎮", rewardVal: 500, rewardType: "credit1", category: "battle",
    check: (d) => ({ done: d.bets > 0, progress: d.bets > 0 ? 1 : 0, max: 1, label: d.bets > 0 ? "已解锁 ✓" : "未开始" }) },
  { id: "bet_50", icon: "🎯", name: "预测达人", desc: "累计 50 次预测", reward: "1,000🎮", rewardVal: 1000, rewardType: "credit1", category: "battle",
    check: (d) => ({ done: d.bets >= 50, progress: d.bets, max: 50, label: `${d.bets}/50` }) },
  { id: "bet_500", icon: "⚔️", name: "百战勇士", desc: "累计 500 次预测", reward: "5,000🎮", rewardVal: 5000, rewardType: "credit1", category: "battle",
    check: (d) => ({ done: d.bets >= 500, progress: d.bets, max: 500, label: `${d.bets}/500` }) },
  { id: "checkin_7", icon: "📅", name: "坚持不懈", desc: "连续签到 7 天", reward: "500🎮", rewardVal: 500, rewardType: "credit1", category: "growth",
    check: (d) => ({ done: d.streak >= 7, progress: Math.min(d.streak, 7), max: 7, label: `${d.streak}/7` }) },
  { id: "checkin_30", icon: "💪", name: "月之星", desc: "连续签到 30 天", reward: "1,000🔮", rewardVal: 1000, rewardType: "credit3", category: "growth",
    check: (d) => ({ done: d.streak >= 30, progress: Math.min(d.streak, 30), max: 30, label: `${d.streak}/30` }) },
  { id: "level_5", icon: "🌿", name: "中级预言师", desc: "达到 Lv.5", reward: "2,000🎮", rewardVal: 2000, rewardType: "credit1", category: "growth",
    check: (d) => ({ done: d.level >= 5, progress: Math.min(d.level, 10), max: 10, label: `Lv.${d.level}` }) },
  { id: "level_10", icon: "🌟", name: "超凡入圣", desc: "达到 Lv.10", reward: "称号·超凡", rewardVal: 0, rewardType: "title", category: "growth",
    check: (d) => ({ done: d.level >= 10, progress: Math.min(d.level, 10), max: 10, label: `Lv.${d.level}/10` }) },
  { id: "first_pk", icon: "⚔️", name: "PK 新秀", desc: "参与 1 场 PK", reward: "300🎮", rewardVal: 300, rewardType: "credit1", category: "social",
    check: (d) => ({ done: d.pk > 0, progress: d.pk > 0 ? 1 : 0, max: 1, label: d.pk > 0 ? "已解锁 ✓" : "未开始" }) },
  { id: "pk_10", icon: "🏟️", name: "PK 达人", desc: "参与 10 场 PK", reward: "1,000🎮", rewardVal: 1000, rewardType: "credit1", category: "social",
    check: (d) => ({ done: d.pk >= 10, progress: Math.min(d.pk, 10), max: 10, label: `${d.pk}/10` }) },
  { id: "invite_1", icon: "🤝", name: "社交达人", desc: "邀请 1 位好友", reward: "1,000🎮", rewardVal: 1000, rewardType: "credit1", category: "social",
    check: (d) => ({ done: d.invites > 0, progress: d.invites > 0 ? 1 : 0, max: 1, label: d.invites > 0 ? "已解锁 ✓" : "未开始" }) },
  { id: "tasks_done", icon: "✅", name: "任务达人", desc: "完成全部 7 个新手任务", reward: "1,000🎮", rewardVal: 1000, rewardType: "credit1", category: "special",
    check: (d) => ({ done: d.tasksDone >= 7, progress: d.tasksDone, max: 7, label: `${d.tasksDone}/7` }) },
  { id: "ai_chat_50", icon: "🤖", name: "AI 驯兽师", desc: "向小章鱼提问 50 次", reward: "1,000🎮", rewardVal: 1000, rewardType: "credit1", category: "special",
    check: (d) => ({ done: d.aiChats >= 50, progress: Math.min(d.aiChats, 50), max: 50, label: `${d.aiChats}/50` }) },
];

const CATEGORIES = [
  { id: "all", label: "全部", icon: "🏆" },
  { id: "battle", label: "战斗", icon: "⚔️" },
  { id: "growth", label: "成长", icon: "🌱" },
  { id: "social", label: "社交", icon: "🤝" },
  { id: "special", label: "特殊", icon: "💎" },
];

/* ─── 任务分组配置 ─── */
const GROUP_CONFIG = [
  { key: "新手必做", keys: ["first_bet", "first_win", "pk_beginner"], icon: "⭐", border: "border-brand-gold/30", bg: "bg-amber-50/40", badge: "bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white" },
  { key: "进阶挑战", keys: ["create_event", "social_butterfly"], icon: "🎯", border: "border-brand-teal/25", bg: "bg-cyan-50/30", badge: "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white" },
  { key: "日常挑战", keys: ["daily_checkin", "all_complete"], icon: "🔄", border: "border-gray-200", bg: "bg-white", badge: "bg-gradient-to-r from-gray-400 to-gray-500 text-white" },
];

/* ─── 签到奖励阶梯 ─── */
const STREAK_REWARDS = [50, 100, 150, 200, 300, 500, 1000];

function getTaskLink(taskKey: string): string {
  const links: Record<string, string> = {
    first_bet: "/pk-hall", first_win: "/pk-hall", pk_beginner: "/pk-hall",
    create_event: "/pk-hall", social_butterfly: "/invite",
    daily_checkin: "/tasks?tab=challenge", all_complete: "/tasks?tab=challenge",
  };
  return links[taskKey] || "/tasks";
}

function rewardStr(task: TaskItem): string {
  const parts: string[] = [];
  if (task.reward_coins > 0) parts.push(`${task.reward_coins}🎮`);
  if (task.reward_beans > 0) parts.push(`${task.reward_beans}🏪`);
  if (task.reward_crystal > 0) parts.push(`${task.reward_crystal}🔮`);
  return parts.join("+") || "奖励";
}

/* ═══════════════════════ 主组件 ═══════════════════════ */
export default function TasksPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState("daily");

  // —— 每日任务状态 ——
  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedMsg, setClaimedMsg] = useState<Record<string, string>>({});

  // —— 成就墙状态 ——
  const [achieveStates, setAchieveStates] = useState<any[]>([]);
  const [achieveLoading, setAchieveLoading] = useState(true);
  const [achieveFilter, setAchieveFilter] = useState("all");
  const [achieveClaiming, setAchieveClaiming] = useState<string | null>(null);
  const [achieveMsg, setAchieveMsg] = useState("");

  // —— 挑战签到状态 ——
  const [signStatus, setSignStatus] = useState<SignStatus | null>(null);
  const [signLoading, setSignLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signResult, setSignResult] = useState<string | null>(null);
  const [challengeBets, setChallengeBets] = useState(false);
  const [challengeInvites, setChallengeInvites] = useState(false);

  /* ──────── 每日任务 API ──────── */
  const fetchTasks = useCallback(async () => {
    if (!user?.uid) return;
    setTasksLoading(true);
    try { setTasksData(await apiFetch<TasksData>(`/api/tasks?uid=${user.uid}`)); }
    catch {} finally { setTasksLoading(false); }
  }, [user?.uid]);

  useEffect(() => { if (user) fetchTasks(); }, [fetchTasks]);

  const handleClaim = async (taskKey: string) => {
    if (!user || claiming) return;
    setClaiming(taskKey);
    try {
      const r = await apiFetch<{ rewards: string }>("/api/tasks/claim", {
        method: "POST", body: JSON.stringify({ uid: user.uid, task_key: taskKey }),
      });
      setClaimedMsg(p => ({...p, [taskKey]: `✅ 领取 ${r.rewards}`}));
      fetchTasks();
    } catch (err: any) {
      setClaimedMsg(p => ({...p, [taskKey]: `❌ ${err?.msg || "领取失败"}`}));
    } finally { setClaiming(null); }
  };

  /* ──────── 成就墙 API ──────── */
  const fetchAchievements = useCallback(async () => {
    if (!user?.uid) return;
    setAchieveLoading(true);
    try {
      const [tasksRes, signRes, levelRes, pkRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/tasks?uid=${user.uid}`).then(r => r.json()),
        fetch(`${API_BASE}/api/sign?uid=${user.uid}`).then(r => r.json()),
        fetch(`${API_BASE}/api/user/level?uid=${user.uid}`).then(r => r.json()),
        fetch(`${API_BASE}/api/pk/rank?uid=${user.uid}`).then(r => r.json()),
      ]);

      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value?.tasks || [] : [];
      const sign = signRes.status === "fulfilled" ? signRes.value : {};
      const level = levelRes.status === "fulfilled" ? levelRes.value : {};
      const pkData = pkRes.status === "fulfilled" ? pkRes.value : {};

      let invites = 0;
      try {
        const inv = await fetch(`${API_BASE}/api/referral?uid=${user.uid}`).then(r => r.json());
        if (inv?.code === 0) invites = inv?.data?.count || 0;
      } catch {}

      const realPkCount = pkData?.data?.total_bets || pkData?.total_bets || 0;

      let aiChats = 0;
      try {
        const aiRes = await fetch(`${API_BASE}/api/ai-deduct-chat?uid=${user.uid}&action=count`);
        const aiJson = await aiRes.json();
        if (aiJson.code === 0) aiChats = aiJson.data?.count || 0;
      } catch {}

      let claimedIds: string[] = [];
      try {
        const ach = await fetch(`${API_BASE}/api/achievement/list?uid=${user.uid}`).then(r => r.json());
        if (ach?.code === 0) claimedIds = (ach?.data || []).map((a: any) => a.achievement_id);
      } catch {}

      const stats = {
        bets: level?.stats?.total_bets || 0, streak: sign?.current_streak || 0,
        level: level?.current_level || level?.level || 0, pk: realPkCount,
        invites, tasksDone: tasks.filter((t: any) => t.is_claimed === 1).length, aiChats,
      };
      setAchieveStates(ALL_ACHIEVEMENTS.map(def => {
        const result = def.check(stats);
        return { id: def.id, ...result, def, claimed: claimedIds.includes(def.id) };
      }));
    } catch {} finally { setAchieveLoading(false); }
  }, [user?.uid]);

  useEffect(() => { if (user) fetchAchievements(); }, [fetchAchievements]);

  const claimAchievement = async (item: any) => {
    setAchieveClaiming(item.id);
    try {
      const r = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: item.def.rewardVal, lottery: "achievement" }),
      });
      const j = await r.json();
      if (j.code === 0) {
        setAchieveMsg(`✅ 领取成功！获得 ${item.def.reward}`);
        setAchieveStates(prev => prev.map(s => s.id === item.id ? { ...s, claimed: true } : s));
      } else setAchieveMsg("❌ 领取失败");
    } catch { setAchieveMsg("❌ 网络异常"); }
    finally { setAchieveClaiming(null); setTimeout(() => setAchieveMsg(""), 2500); }
  };

  /* ──────── 挑战签到 API ──────── */
  const fetchSign = useCallback(async () => {
    if (!user?.uid) return;
    setSignLoading(true);
    try {
      const data = await apiFetch<SignStatus>(`/api/sign?uid=${user.uid}`);
      setSignStatus(data);
    } catch {} finally { setSignLoading(false); }
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    fetchSign();
    apiFetch(`/api/tasks?uid=${user.uid}`).then((d: any) => {
      const tasks = d?.tasks || [];
      setChallengeBets(tasks.some((t: any) => t.task_key === "first_bet" && t.user_progress >= t.target_count));
      setChallengeInvites(tasks.some((t: any) => t.task_key === "social_butterfly" && t.user_progress >= t.target_count));
    }).catch(() => {});
  }, [user, fetchSign]);

  const handleSign = async () => {
    if (signing || signStatus?.signed_today) return;
    setSigning(true); setSignResult(null);
    try {
      const data = await apiFetch<{ signed: boolean; streak: number; reward: number; msg: string }>(
        "/api/sign", { method: "POST", body: JSON.stringify({ uid: user?.uid }) }
      );
      setSignResult(data.msg);
      await fetchSign();
      setTimeout(() => setSignResult(null), 3000);
    } catch (err: any) {
      setSignResult(err?.message || "签到失败");
    } finally { setSigning(false); }
  };

  /* ──────── 计算每日任务数据 ──────── */
  const tasks = tasksData?.tasks || [];
  const doneTasks = tasks.filter(t => t.user_progress >= t.target_count);
  const doneCount = doneTasks.length;
  const totalCount = tasks.filter(t => t.task_key !== "all_complete").length;
  const allDone = doneCount >= totalCount;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const earnedCoins = tasks.filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete").reduce((s, t) => s + t.reward_coins, 0);
  const earnedBeans = tasks.filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete").reduce((s, t) => s + t.reward_beans, 0);
  const earnedCrystal = tasks.filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete").reduce((s, t) => s + t.reward_crystal, 0);
  const lifetimeDone = tasks.find(t => t.task_key === "all_complete")?.user_progress || 0;
  const checkinStreak = tasks.find(t => t.task_key === "daily_checkin")?.user_progress || 0;
  const MILESTONES = [
    { count: 3, icon: "🎖️", label: "小试牛刀" },
    { count: 7, icon: "🏆", label: "游刃有余" },
    { count: 15, icon: "🗿", label: "任务达人" },
    { count: 30, icon: "👑", label: "巅峰王者" },
  ];

  const streak = signStatus?.current_streak ?? 0;
  const signedToday = signStatus?.signed_today ?? false;
  const todayReward = signStatus?.today_reward ?? 50;

  /* ═══════════════════════ 未登录态 ═══════════════════════ */
  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">📋</div>
          <div className="text-lg font-bold mb-1 text-text-primary">任务中心</div>
          <div className="text-sm text-text-tertiary mb-6">登录后查看任务、成就和挑战</div>
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
      {/* ═══ 品牌色 Header ═══ */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-4 rounded-b-[28px] shadow-soft">
        <h1 className="text-lg font-bold tracking-tight mb-3">📋 任务中心</h1>
        {/* Tab 切换 */}
        <div className="flex gap-1.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-[8px] text-[11px] font-medium transition-all active:scale-95 ${
                tab === t.id ? "bg-white/20 text-white shadow-sm" : "bg-white/8 text-white/70"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════ Tab 1: 每日任务 ═══════════════════ */}
      {tab === "daily" && (
        <>
          {/* 今日收益看板 */}
          <div className="px-4 -mt-4 relative z-10 mb-3.5">
            <div className="bg-surface rounded-2xl shadow-card border border-brand-teal/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1">📈 今日收益</span>
                <span className="text-[10px] text-text-tertiary">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-4 mb-2.5">
                {earnedCoins > 0 && <span className="text-base font-bold text-brand-teal-dark">+{earnedCoins}🎮</span>}
                {earnedBeans > 0 && <span className="text-sm font-bold text-brand-gold-dark">+{earnedBeans}🏪</span>}
                {earnedCrystal > 0 && <span className="text-sm font-bold text-brand-coral">+{earnedCrystal}🔮</span>}
                {earnedCoins === 0 && earnedBeans === 0 && earnedCrystal === 0 && (
                  <span className="text-xs text-text-tertiary">今天还没完成任务哦</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
                <span>完成 {doneCount}/{totalCount} 个</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-teal to-brand-gold rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
              {checkinStreak > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-text-tertiary">
                  <span>🔥 连续签到</span>
                  <span className="font-bold text-brand-teal-dark">{checkinStreak} 天</span>
                </div>
              )}
            </div>
          </div>

          {/* 任务分组 */}
          <div className="px-4 space-y-3.5 relative z-10">
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(g => (
                  <div key={g} className="bg-surface rounded-2xl p-4 shadow-card animate-pulse border border-border">
                    <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                    {[1, 2].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl mb-2" />)}
                  </div>
                ))}
              </div>
            ) : (
              GROUP_CONFIG.map(group => {
                const groupTasks = group.keys.map(key => tasks.find(t => t.task_key === key)).filter(Boolean) as TaskItem[];
                if (groupTasks.length === 0) return null;
                const groupDone = groupTasks.filter(t => t.user_progress >= t.target_count).length;
                return (
                  <div key={group.key} className={`bg-surface rounded-2xl shadow-card border ${group.border} overflow-hidden`}>
                    <div className={`flex items-center justify-between px-4 pt-3.5 pb-2 ${group.bg}`}>
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">{group.icon} {group.key}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${group.badge}`}>{groupDone}/{groupTasks.length}</span>
                    </div>
                    <div className="px-3 pb-3 space-y-2">
                      {groupTasks.map(task => {
                        const done = task.user_progress >= task.target_count;
                        const claimed = task.is_claimed === 1;
                        const cardContent = (
                          <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            done && !claimed ? "bg-gradient-to-r from-amber-50 to-amber-100/60 border border-brand-gold/20" :
                            claimed ? "bg-green-50/50 border border-green-100" : "bg-bg/50 border border-transparent hover:bg-gray-50/50"
                          }`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                              claimed ? "bg-green-100 text-green-600" : done ? "bg-brand-gold-light text-brand-gold-dark" : "bg-gray-100 text-text-tertiary"
                            }`}>{claimed ? "✓" : done ? "⭐" : task.icon || task.sort_order}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-text-primary">{task.name_zh}</span>
                                {done && !claimed && <span className="text-[9px] bg-brand-gold/15 text-brand-gold-dark font-medium px-1.5 py-0.5 rounded-md">可领取</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] ${done ? "text-brand-teal-dark font-medium" : "text-text-tertiary"}`}>
                                  {done ? (claimed ? "✅ 已领取" : "🎉 任务完成！") : `进度 ${task.user_progress}/${task.target_count}`}
                                </span>
                                {!done && (
                                  <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${Math.max(Math.round(task.user_progress / task.target_count * 100), 5)}%` }} />
                                  </div>
                                )}
                              </div>
                              {claimedMsg[task.task_key] && (
                                <div className="mt-0.5 text-[10px] font-medium" style={{ color: claimedMsg[task.task_key].startsWith("✅") ? "#16a34a" : "#dc2626" }}>
                                  {claimedMsg[task.task_key]}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-[11px] font-bold text-text-primary">{rewardStr(task)}</div>
                              {done && !claimed && (
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClaim(task.task_key); }} disabled={claiming === task.task_key}
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
                        // 未完成 → 整张卡片可点击跳转; 已完成 → 普通卡片
                        return !done ? (
                          <Link key={task.task_key} href={getTaskLink(task.task_key)} className="block active:scale-[0.98] transition-transform">
                            {cardContent}
                          </Link>
                        ) : (
                          <div key={task.task_key}>{cardContent}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 成就里程碑 */}
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
                    <div className={`text-[11px] font-semibold ${reached ? "text-brand-gold-dark" : "text-text-tertiary"}`}>{m.count}个</div>
                    <div className={`text-[9px] ${reached ? "text-brand-gold-dark/70" : "text-text-tertiary"}`}>{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {allDone && (
            <div className="mx-4 mt-4 bg-gradient-to-r from-brand-gold/10 to-brand-teal/10 rounded-2xl border border-brand-gold/20 p-4 text-center animate-fade-in">
              <div className="text-2xl mb-1">🎉</div>
              <div className="text-sm font-bold text-brand-gold-dark mb-0.5">今日任务全部完成！</div>
              <div className="text-xs text-text-tertiary">明天还有新奖励等着你</div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ Tab 2: 成就墙 ═══════════════════ */}
      {tab === "achieve" && (
        <>
          {/* 成就概览 */}
          <div className="px-4 -mt-4 relative z-10 mb-3">
            <div className="bg-surface rounded-2xl shadow-card border border-brand-teal/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-primary">🏆 成就进度</span>
                <span className="text-[10px] text-text-tertiary">
                  {achieveStates.filter(s => s.claimed).length}/{ALL_ACHIEVEMENTS.length}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-full transition-all"
                  style={{ width: `${achieveStates.length > 0 ? (achieveStates.filter(s => s.done).length / ALL_ACHIEVEMENTS.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* 分类过滤 */}
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setAchieveFilter(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors ${
                  achieveFilter === c.id ? 'bg-brand-teal text-white' : 'bg-white text-text-tertiary border border-gray-100'
                }`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* 成就列表 */}
          <div className="px-4 space-y-2">
            {achieveLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface rounded-[12px] p-4 animate-pulse border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-3 w-32 bg-gray-50 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              achieveStates.filter(s => achieveFilter === "all" || s.def.category === achieveFilter).map(s => (
                <div key={s.id} className={`bg-surface rounded-[12px] p-4 shadow-sm border transition-all ${
                  s.done ? 'border-brand-teal/30 bg-brand-teal/5' : 'border-border'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0 ${
                      s.done ? 'bg-brand-teal/20' : 'bg-gray-50'
                    }`}>{s.claimed ? '✅' : s.done ? '🔓' : s.def.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{s.def.name}</div>
                      <div className="text-[10px] text-text-tertiary">{s.def.desc}</div>
                      <div className={`text-[9px] mt-0.5 ${s.claimed ? 'text-brand-teal-dark' : s.done ? 'text-brand-gold-dark' : 'text-text-tertiary'}`}>
                        {s.claimed ? '✅ 已领取' : s.done ? '🔓 可领取' : s.label}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-text-tertiary">奖励</div>
                      <div className="text-[11px] font-medium">{s.def.reward}</div>
                      {s.done && !s.claimed && (
                        <button onClick={() => claimAchievement(s)} disabled={achieveClaiming === s.id}
                          className="mt-1 text-[9px] bg-brand-gold text-white px-2 py-0.5 rounded-full font-medium active:scale-90">
                          {achieveClaiming === s.id ? "领取中..." : "领取"}
                        </button>
                      )}
                      {s.claimed && <div className="mt-1 text-[9px] text-brand-teal-dark">✅ 已领</div>}
                    </div>
                  </div>
                  {!s.done && s.max > 1 && (
                    <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-teal rounded-full" style={{ width: `${Math.round(s.progress / s.max * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))
            )}
            {!achieveLoading && achieveStates.filter(s => achieveFilter === "all" || s.def.category === achieveFilter).length === 0 && (
              <div className="bg-surface rounded-[12px] p-6 text-center text-[12px] text-text-tertiary border border-border">
                该分类暂无成就
              </div>
            )}
          </div>

          {achieveMsg && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur shadow-lg border border-border-tertiary/60 px-4 py-2 rounded-full text-xs font-medium animate-in">
              {achieveMsg}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ Tab 3: 挑战签到 ═══════════════════ */}
      {tab === "challenge" && (
        <>
          <div className="px-4 -mt-4 relative z-10 mb-3">
            {/* 签到卡片 */}
            <div className="bg-gradient-to-br from-brand-teal-light/20 to-brand-teal/5 rounded-[10px] p-4 border border-brand-teal/20 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">📅</span>
                <span className="text-xs font-semibold text-brand-teal-dark">每日签到</span>
              </div>
              {/* 7天签到表 */}
              <div className="flex gap-1 mb-3">
                {STREAK_REWARDS.map((reward, i) => {
                  const dayNum = i + 1;
                  const isActive = dayNum <= streak && signedToday;
                  const isToday = dayNum === streak + 1;
                  const isPast = dayNum <= streak;
                  return (
                    <div key={i} className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[10px] transition-all ${
                      isActive ? "bg-brand-teal-dark text-white shadow-sm" :
                      isToday && !signedToday ? "bg-brand-gold-light/60 text-brand-gold-dark ring-2 ring-brand-gold" :
                      isPast ? "bg-brand-teal-light/30 text-brand-teal-dark" : "bg-white/60 text-gray-400"
                    }`}>
                      <span className="text-[9px] font-bold">D{dayNum}</span>
                      <span className="text-[10px] font-semibold">+{reward}</span>
                      <span className="text-[8px] opacity-70">{isActive ? "✅" : isToday && !signedToday ? "⭕" : ""}</span>
                    </div>
                  );
                })}
              </div>
              {/* 签到按钮 */}
              {signLoading ? (
                <div className="h-9 bg-white/60 rounded-[10px] animate-pulse" />
              ) : signResult ? (
                <div className="text-center py-2 text-[11px] font-medium text-brand-teal-dark bg-brand-teal-light/30 rounded-[10px]">{signResult}</div>
              ) : (
                <button onClick={handleSign} disabled={signedToday || signing}
                  className={`w-full py-2 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.97] ${
                    signedToday ? "bg-gray-200 text-gray-400 cursor-default" :
                    "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-[0_2px_8px_rgba(69,204,213,0.25)]"
                  }`}>
                  {signing ? "签到中..." : signedToday ? "✅ 今日已签到" : `🎯 签到领 ${todayReward} 游戏豆`}
                </button>
              )}
            </div>

            {/* 任务列表 */}
            <div className="bg-surface rounded-[10px] border border-border divide-y divide-border/30 overflow-hidden">
              {[
                { icon: "🎯", label: challengeBets ? "✅ 已预测" : "预测下注", desc: "参与任意预测并下注", done: challengeBets, link: "/pk-hall" },
                { icon: "🤝", label: challengeInvites ? "✅ 已邀请" : "邀请好友", desc: "邀请好友注册", done: challengeInvites, link: "/jiadouzhan" },
                { icon: "🎰", label: "数字碰投注", desc: "参与数字碰游戏", done: false, link: "/lottery-sim" },
                { icon: "🤖", label: "AI 提问", desc: "向小章鱼AI提问", done: false, link: "/ai-predictions" },
              ].map((item, i) => {
                const row = (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-[10px] bg-bg flex items-center justify-center text-sm">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium">{item.label}</div>
                      <div className="text-[9px] text-text-tertiary mt-0.5">{item.desc}</div>
                    </div>
                    {item.done ? (
                      <span className="text-[10px] text-green-500 font-medium">已完成 ✅</span>
                    ) : (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[10px] font-medium rounded-[8px] shadow-sm">
                        去完成
                      </span>
                    )}
                  </div>
                );
                return item.done ? (
                  <div key={i}>{row}</div>
                ) : (
                  <Link key={i} href={item.link} className="block active:scale-[0.98] transition-transform">{row}</Link>
                );
              })}
            </div>

            {/* 挑战成就进度 */}
            <div className="mt-3 bg-surface rounded-[10px] border border-border p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">🏅</span>
                <span className="text-xs font-bold text-text-primary">连续签到成就</span>
                <span className="text-[10px] text-text-tertiary ml-auto">🔥 {streak} 天</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-full transition-all" style={{ width: `${Math.min(100, (streak / 30) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-text-tertiary mt-1">
                <span>🌱 初心</span><span>🥉 7天</span><span>🥈 15天</span><span>🥇 30天</span><span>👑 100天</span>
              </div>
            </div>
          </div>
        </>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
