"use client";

/**
 * 📋 每日挖豆任务
 *
 * - 7天连续签到阶梯奖励
 * - 每日任务列表
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/config/api";
import {
  CalendarCheck,
  Target,
  Trophy,
  Gift,
  Loader2,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

// 签到阶梯
const STREAK_REWARDS = [50, 100, 150, 200, 300, 500, 1000];

interface SignStatus {
  signed_today: boolean;
  current_streak: number;
  today_reward: number;
  next_reward: number;
  streak_records: { date: string; streak: number; reward: number }[];
}

interface TaskItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
  reward: number;
  done: boolean;
  maxDaily: number;
  currentDaily: number;
  link?: string;
  action?: () => void;
}

interface Props {
  uid: number;
  onBalanceRefresh: () => void;
}

export default function DailyTasks({ uid, onBalanceRefresh }: Props) {
  const [signStatus, setSignStatus] = useState<SignStatus | null>(null);
  const [signLoading, setSignLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signResult, setSignResult] = useState<string | null>(null);
  const [hasBets, setHasBets] = useState(false);
  const [hasInvites, setHasInvites] = useState(false);

  // 查询签到状态
  const fetchSignStatus = useCallback(async () => {
    try {
      const data = await apiFetch<SignStatus>(`/api/sign?uid=${uid}`);
      setSignStatus(data);
    } catch {
      // 静默失败
    } finally {
      setSignLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchSignStatus();
    // 查询用户是否有投注和邀请
    apiFetch(`/api/tasks?uid=${uid}`).then((d: any) => {
      const tasks = d?.tasks || [];
      setHasBets(tasks.some((t: any) => t.task_key === "first_bet" && t.user_progress >= t.target_count));
      setHasInvites(tasks.some((t: any) => t.task_key === "social_butterfly" && t.user_progress >= t.target_count));
    }).catch(() => console.warn("请求 失败"));
  }, [fetchSignStatus, uid]);

  // 执行签到
  const handleSign = async () => {
    if (signing || signStatus?.signed_today) return;
    setSigning(true);
    setSignResult(null);
    try {
      const data = await apiFetch<{ signed: boolean; streak: number; reward: number; msg: string }>(
        "/api/sign",
        { method: "POST", body: JSON.stringify({ uid }) }
      );
      setSignResult(data.msg);
      onBalanceRefresh();
      await fetchSignStatus();
      setTimeout(() => setSignResult(null), 3000);
    } catch (err) {
      setSignResult(err instanceof ApiError ? err.message : "签到失败");
    } finally {
      setSigning(false);
    }
  };

  const streak = signStatus?.current_streak ?? 0;
  const signedToday = signStatus?.signed_today ?? false;
  const todayReward = signStatus?.today_reward ?? 50;

  // 任务列表
  const tasks: TaskItem[] = [
    {
      icon: <CalendarCheck className="w-4 h-4 text-emerald-500" />,
      label: signedToday ? "今日已签到" : "每日签到",
      desc: signedToday
        ? `连续签到 D${streak} · 明日 +${signStatus?.next_reward ?? 50}`
        : `签到得 ${todayReward} 游戏豆`,
      reward: todayReward,
      done: signedToday,
      maxDaily: 1,
      currentDaily: signedToday ? 1 : 0,
      action: handleSign,
    },
    {
      icon: <Target className="w-4 h-4 text-blue-500" />,
      label: hasBets ? "✅ 已预测" : "预测下注",
      desc: "参与任意预测并下注",
      reward: 100,
      done: hasBets,
      maxDaily: 5,
      currentDaily: hasBets ? 1 : 0,
      link: "/pk-hall",
    },
    {
      icon: <Users className="w-4 h-4 text-purple-500" />,
      label: hasInvites ? "✅ 已邀请" : "邀请好友",
      desc: "邀请好友注册并完成首单",
      reward: 150000,
      done: hasInvites,
      maxDaily: 999,
      currentDaily: 0,
      link: "/jiadouzhan",
    },
  ];

  return (
    <section className="mx-4 mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-4 h-4 text-brand-gold" />
        <h3 className="text-xs font-semibold">📋 每日挖豆任务</h3>
      </div>

      {/* 签到卡片 — 品牌色 */}
      <div className="bg-gradient-to-br from-brand-teal-light/20 to-brand-teal/5 rounded-[8px] p-4 border border-brand-teal/20 mb-2.5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck className="w-4 h-4 text-brand-teal-dark" />
          <span className="text-xs font-semibold text-brand-teal-dark">📅 每日签到</span>
        </div>

        {/* 7天签到表 */}
        <div className="flex gap-1 mb-3">
          {STREAK_REWARDS.map((reward, i) => {
            const dayNum = i + 1;
            const isActive = dayNum <= streak && signedToday;
            const isToday = dayNum === streak + 1;
            const isPast = dayNum <= streak;
            const isFuture = dayNum > streak + (signedToday ? 0 : 1);

            return (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[10px] transition-all ${
                  isActive
                    ? "bg-brand-teal-dark text-white shadow-sm"
                    : isToday && !signedToday
                    ? "bg-brand-gold-light/60 text-brand-gold-dark ring-2 ring-brand-gold"
                    : isPast
                    ? "bg-brand-teal-light/30 text-brand-teal-dark"
                    : "bg-white/60 text-gray-400"
                }`}
              >
                <span className="text-[9px] font-bold">D{dayNum}</span>
                <span className="text-[10px] font-semibold">+{reward}</span>
                <span className="text-[8px] opacity-70">
                  {isActive ? "✅" : isToday && !signedToday ? "⭕" : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* 签到按钮 & 结果 */}
        {signLoading ? (
          <div className="h-9 bg-white/60 rounded-[10px] animate-pulse" />
        ) : signResult ? (
          <div className="text-center py-2 text-[11px] font-medium text-brand-teal-dark bg-brand-teal-light/30 rounded-[10px] animate-fade-in">
            {signResult}
          </div>
        ) : (
          <button
            onClick={handleSign}
            disabled={signedToday || signing}
            className={`w-full py-2 rounded-[10px] text-xs font-semibold transition-all active:scale-[0.97] ${
              signedToday
                ? "bg-gray-200 text-gray-400 cursor-default"
                : "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-[0_2px_8px_rgba(69,204,213,0.25)]"
            }`}
          >
            {signing ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 签到中...
              </span>
            ) : signedToday ? (
              "✅ 今日已签到"
            ) : (
              `🎯 签到领 ${todayReward} 游戏豆`
            )}
          </button>
        )}
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-[8px] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-[10px] bg-gray-50 flex items-center justify-center">
              {task.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium">{task.label}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">
                {task.done ? task.desc : `${task.desc} · 今日 ${task.currentDaily}/${task.maxDaily}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.link ? (
                <Link
                  href={task.link}
                  className="px-3 py-1.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[10px] font-medium rounded-[8px] active:scale-95 transition-transform"
                >
                  去完成
                </Link>
              ) : task.action && !task.done ? (
                <button
                  onClick={task.action}
                  className="px-3 py-1.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[10px] font-medium rounded-[8px] active:scale-95 transition-transform"
                >
                  去签到
                </button>
              ) : task.done ? (
                <span className="text-[10px] text-green-500 font-medium">已完成 ✅</span>
              ) : null}
              {task.reward > 0 && (
                <span className="text-[9px] text-amber-600 font-medium whitespace-nowrap">
                  +{task.reward >= 1000 ? `${(task.reward / 1000).toFixed(0)}k` : task.reward}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
