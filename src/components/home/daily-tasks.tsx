"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import Link from "next/link";

interface TaskData {
  task_key: string;
  name_zh: string;
  user_progress: number;
  target_count: number;
  is_claimed: boolean;
}

const TASK_KEYS = ["daily_checkin", "first_bet", "pk_newbie", "social_butterfly"];
const TASK_LABELS: Record<string, string> = {
  daily_checkin: "签到",
  first_bet: "投注",
  pk_newbie: "PK",
  social_butterfly: "消费",
};

export function DailyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskData[]>([]);

  useEffect(() => {
    const uid = (user as any)?.uid || 0;
    if (!uid) return;
    fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.code === 0) {
          const filtered = d.data.filter((t: TaskData) => TASK_KEYS.includes(t.task_key));
          setTasks(filtered);
        }
      })
      .catch(() => {});
  }, [user]);

  const displayTasks = tasks.length > 0
    ? tasks
    : TASK_KEYS.map(key => ({
        task_key: key,
        name_zh: TASK_LABELS[key],
        user_progress: 0,
        target_count: 1,
        is_claimed: false,
      }));

  return (
    <Link href="/tasks"
      className="block bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm px-4 py-3.5 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-text-primary">每日任务</span>
        <span className="text-[11px] font-medium text-brand-teal">领 500 豆 →</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {displayTasks.map((task) => {
          const done = task.user_progress >= task.target_count;
          return (
            <div key={task.task_key}
              className={`text-center py-2 px-1 rounded-[8px] text-[11px] font-medium transition-colors ${
                done
                  ? "bg-brand-teal-light/50 text-brand-teal-dark"
                  : "bg-gray-50 text-text-tertiary"
              }`}>
              {task.name_zh || TASK_LABELS[task.task_key] || task.task_key}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
