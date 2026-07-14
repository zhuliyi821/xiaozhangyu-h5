"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import Link from "next/link";
import LoginModal from "@/components/ui/login-modal";

interface BackendTask {
  task_key: string;
  name_zh: string;
  user_progress: number;
  target_count: number;
  is_claimed: number;
}

/** 首页展示的简单任务概览（4格：签到/参与/PK/消费） */
const DISPLAY_KEYS = ["daily_checkin", "first_bet", "pk_beginner", "social_butterfly"];
const KEY_LABELS: Record<string, string> = {
  daily_checkin: "签到",
  first_bet: "参与",
  pk_beginner: "PK",
  social_butterfly: "消费",
};
const REWARD_MAP: Record<string, { coins: number; beans: number; crystal: number }> = {
  daily_checkin: { coins: 0, beans: 0, crystal: 1 },
  first_bet: { coins: 100, beans: 0, crystal: 0 },
  pk_beginner: { coins: 0, beans: 100, crystal: 0 },
  social_butterfly: { coins: 0, beans: 50, crystal: 0 },
};

export function DailyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const uid = (user as any)?.uid || 0;
    if (!uid) { setLoaded(true); return; }
    fetch(`${API_BASE}/api/tasks?uid=${uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0) {
          const allTasks: BackendTask[] = d.data?.tasks || [];
          const filtered = DISPLAY_KEYS.map(key =>
            allTasks.find(t => t.task_key === key) || {
              task_key: key, name_zh: KEY_LABELS[key] || key,
              user_progress: 0, target_count: 1, is_claimed: 0,
            }
          );
          setTasks(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user]);

  // 计算进度和奖励
  const doneCount = tasks.filter(t => t.user_progress >= t.target_count).length;
  const totalTasks = tasks.length;
  // 每日总奖池估算
  const totalReward = Object.values(REWARD_MAP).reduce((sum, r) => sum + r.coins + r.beans * 5 + r.crystal * 200, 0);
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // 默认展示4项（未加载时）
  const display = loaded && tasks.length > 0
    ? tasks
    : DISPLAY_KEYS.map(key => ({
        task_key: key, name_zh: KEY_LABELS[key], user_progress: 0, target_count: 1, is_claimed: 0,
      }));

  return (
    <>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    {!user ? (
      /* 未登录状态 — 引导登录 */
      <div className="bg-white rounded-[12px] border border-brand-teal/10 shadow-sm px-4 py-3.5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-text-primary">📋 每日任务</h2>
        </div>
        <div className="text-center py-3">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-[13px] font-medium text-text-secondary mb-1">登录后查看今日任务</div>
          <div className="text-[11px] text-text-tertiary mb-3">完成任务可领取游戏豆、水晶石等奖励</div>
          <button onClick={() => setShowLogin(true)}
            className="px-5 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[12px] font-medium active:scale-95 transition-transform shadow-sm">
            立即登录
          </button>
        </div>
      </div>
    ) : (
    <Link href="/tasks"
      className="block bg-white rounded-[12px] border border-brand-teal/10 shadow-sm px-4 py-3.5 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-bold text-text-primary">📋 每日任务</h2>
        {loaded && (
          <span className="text-[11px] font-medium text-brand-teal">完成 {doneCount}/{totalTasks} →</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {display.map((task) => {
          const done = task.user_progress >= task.target_count;
          return (
            <div key={task.task_key}
              className={`text-center py-2 px-1 rounded-[8px] text-[11px] font-medium transition-colors ${
                done
                  ? "bg-brand-teal-light/50 text-brand-teal-dark"
                  : "bg-gray-50 text-text-tertiary"
              }`}>
              {KEY_LABELS[task.task_key] || task.name_zh || task.task_key}
            </div>
          );
        })}
      </div>
      {/* 进度条 */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[9px] text-text-tertiary mb-1">
          <span>{doneCount}/{totalTasks} 已完</span>
          <span>进度 {pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-teal to-brand-gold rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        {doneCount === totalTasks - 1 && (
          <div className="text-[10px] text-brand-gold-dark font-medium text-center mt-1 animate-pulse">
            ⚡ 还差1个任务！加油！
          </div>
        )}
        {doneCount === totalTasks && (
          <div className="text-[10px] text-brand-teal-dark font-medium text-center mt-1">
            ✅ 今日全部完成！
          </div>
        )}
      </div>
    </Link>
    )}
    </>
  );
}
