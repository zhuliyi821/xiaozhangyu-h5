"use client";

/** 🏆 成就墙 v2 — 品牌色统一 + 可领取奖励 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  reward: string;
  rewardVal: number;
  rewardType: string;
  category: string;
  check: (data: any) => { done: boolean; progress: number; max: number; label: string };
}

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

export default function AchievementsPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [states, setStates] = useState<{ id: string; done: boolean; progress: number; max: number; label: string; def: AchievementDef; claimed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
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

      // 从邀请表获取真实邀请数
      let invites = 0;
      try {
        const inv = await fetch(`${API_BASE}/api/referral?uid=${user.uid}`).then(r => r.json());
        if (inv?.code === 0) invites = inv?.data?.count || 0;
      } catch {}

      const realPkCount = pkData?.data?.total_bets || pkData?.total_bets || tasks.filter((t: any) => t.task_key === "pk_beginner" && t.user_progress > 0).length;

      const stats = {
        bets: level?.stats?.total_bets || 0,
        streak: sign?.current_streak || 0,
        level: level?.current_level || level?.level || 0,
        pk: realPkCount,
        invites: invites,
        tasksDone: tasks.filter((t: any) => t.is_claimed === 1).length,
        aiChats: 0,
      };

      // 尝试从AI API获取聊天计数
      try {
        const aiRes = await fetch(`${API_BASE}/api/ai-deduct-chat?uid=${user.uid}&action=count`);
        const aiJson = await aiRes.json();
        if (aiJson.code === 0) stats.aiChats = aiJson.data?.count || 0;
      } catch {}

      // 获取已领取的成就记录
      let claimedIds: string[] = [];
      try {
        const ach = await fetch(`${API_BASE}/api/achievement/list?uid=${user.uid}`).then(r => r.json());
        if (ach?.code === 0) claimedIds = (ach?.data || []).map((a: any) => a.achievement_id);
      } catch {}

      const computed = ALL_ACHIEVEMENTS.map(def => {
        const result = def.check(stats);
        return { id: def.id, ...result, def, claimed: claimedIds.includes(def.id) };
      });
      setStates(computed);
    } catch {} finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const claimReward = async (item: typeof states[0]) => {
    setClaiming(item.id);
    try {
      const r = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: item.def.rewardVal, lottery: "achievement" }),
      });
      const j = await r.json();
      if (j.code === 0) {
        setMsg(`✅ 领取成功！获得 ${item.def.reward}`);
        setStates(prev => prev.map(s => s.id === item.id ? { ...s, claimed: true } : s));
      } else {
        setMsg("❌ 领取失败，请重试");
      }
    } catch { setMsg("❌ 网络异常"); }
    finally { setClaiming(null); setTimeout(() => setMsg(""), 2500); }
  };

  const filtered = filter === "all" ? states : states.filter(s => s.def.category === filter);
  const doneCount = states.filter(s => s.done).length;
  const claimedCount = states.filter(s => s.claimed).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-[15px] font-medium mb-1">成就墙</div>
          <div className="text-[11px] text-text-tertiary mb-4">登录后查看成就进度</div>
          <button onClick={() => setShowLogin(true)}
            className="bg-brand-teal text-white text-[12px] px-6 py-2 rounded-[10px] font-medium">立即登录</button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header — 品牌色统一 */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-6 rounded-b-[24px]">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold">🏆 成就墙</h1>
          <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-[8px]">
            {claimedCount}/{ALL_ACHIEVEMENTS.length}
          </span>
        </div>
        <p className="text-[11px] opacity-80">完成特定目标解锁成就</p>

        <div className="mt-3 bg-white/10 rounded-[10px] p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px]">总进度</span>
            <span className="text-[11px] font-medium">{Math.round(doneCount / ALL_ACHIEVEMENTS.length * 100)}%</span>
          </div>
          <div className="h-2 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-full transition-all"
              style={{ width: `${doneCount / ALL_ACHIEVEMENTS.length * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Category tabs — 品牌色 */}
      <div className="flex gap-2 mx-4 mt-3 mb-3 overflow-x-auto">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors ${
              filter === c.id ? 'bg-brand-teal text-white' : 'bg-white text-text-tertiary border border-gray-100'
            }`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {msg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur shadow-lg border border-border-tertiary/60 px-4 py-2 rounded-full text-xs font-medium animate-in">
          {msg}
        </div>
      )}

      {/* Achievement list */}
      <div className="mx-4 space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-[12px] p-4 animate-pulse border border-gray-100">
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
          filtered.map(s => (
            <div key={s.id}
              className={`bg-white rounded-[12px] p-4 shadow-sm border transition-all ${
                s.done ? 'border-brand-teal/30 bg-brand-teal/5' : 'border-gray-100'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0 ${
                  s.done ? 'bg-brand-teal/20' : 'bg-gray-50'
                }`}>
                  {s.claimed ? '✅' : s.done ? '🔓' : s.def.icon}
                </div>
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
                    <button onClick={() => claimReward(s)} disabled={claiming === s.id}
                      className="mt-1 text-[9px] bg-brand-gold text-white px-2 py-0.5 rounded-full font-medium active:scale-90">
                      {claiming === s.id ? "领取中..." : "领取"}
                    </button>
                  )}
                  {s.claimed && (
                    <div className="mt-1 text-[9px] text-brand-teal-dark">✅ 已领</div>
                  )}
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

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-[12px] p-6 text-center text-[12px] text-text-tertiary border border-gray-100">
            该分类暂无成就
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
