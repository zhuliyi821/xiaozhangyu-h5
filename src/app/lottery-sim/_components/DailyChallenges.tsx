"use client";

import { ChevronDown } from "lucide-react";

interface DailyTasksData {
  date: string;
  checkedIn: boolean;
  betCount: number;
  hotWin: boolean;
  earn50: boolean;
  streak3: number;
  claimed: string[];
  streakDay: number;
  chestStars: number;
  chestOpened: boolean;
}

interface DailyChallengesProps {
  user: any;
  dailyTasks: DailyTasksData;
  onSetDailyTasks: (v: DailyTasksData | ((prev: DailyTasksData) => DailyTasksData)) => void;
  achievements: Record<string, boolean>;
  onSetAchievements: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  balance: number;
  onSetBalance: (v: number | ((prev: number) => number)) => void;
  showTasks: boolean;
  onSetShowTasks: (v: boolean) => void;
  apiBase: string;
}

const STREAK_BONUS = [0, 0, 0.3, 0.5, 0.7];
const CHEST_COST = 3;
const BONUS_ALL_CLEAR = 30;

const TASK_LIST = [
  { zone: "morning", id: "checkin", label: "☀️ 晨间签到", desc: "新的一天，来签到吧", reward: 10 },
  { zone: "core", id: "bet3", label: "🎯 参与达人", desc: "参与 3 次", target: 3, reward: 15 },
  { zone: "core", id: "hotWin", label: "🔥 热号追踪", desc: "选热号(scorching/hot)并中奖", target: 1, reward: 20 },
  { zone: "core", id: "earn50", label: "💰 日入百金", desc: "单局净赚 ≥50🎮", target: 1, reward: 25 },
  { zone: "challenge", id: "streak3", label: "👑 五连暴击", desc: "连续中奖 3 次", target: 3, reward: 50 },
];

const ACHIEVEMENT_LIST = [
  { id: "first_bet", label: "🥉 数字新手", desc: "首次参与", reward: "10🎮" },
  { id: "bet_100", label: "🥈 百战勇士", desc: "参与 100 次", reward: "100🎮" },
  { id: "bet_1000", label: "🥇 千次挑战", desc: "参与 1000 次", reward: "500🎮" },
  { id: "streak_5", label: "🔥 五连胜", desc: "连续 5 局赢", reward: "200🎮" },
  { id: "jackpot", label: "💎 天选之人", desc: "中过头彩", reward: "1000🎮" },
  { id: "night_owl", label: "🌙 夜猫子", desc: "凌晨 1-5 点参与", reward: "50🎮" },
];

function getTaskProgress(tasks: DailyTasksData) {
  return {
    checkin: tasks.checkedIn ? 1 : 0,
    bet3: tasks.betCount,
    hotWin: tasks.hotWin ? 1 : 0,
    earn50: tasks.earn50 ? 1 : 0,
    streak3: tasks.streak3,
  };
}

export default function DailyChallenges({
  user, dailyTasks, onSetDailyTasks, achievements, onSetAchievements,
  balance, onSetBalance, showTasks, onSetShowTasks, apiBase,
}: DailyChallengesProps) {
  const taskProgress = getTaskProgress(dailyTasks);

  return (
    <div className="px-4 mt-2 mb-2">
      <div className="bg-surface rounded-[8px] shadow-sm border border-border-tertiary overflow-hidden">
        <button onClick={() => onSetShowTasks(!showTasks)}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold active:bg-gray-50 transition-colors">
          <span>🏆 每日挑战 · 成就</span>
          <div className="flex items-center gap-2">
            {(() => {
              const doneCount = TASK_LIST.filter(t => {
                const p = taskProgress[t.id as keyof typeof taskProgress] || 0;
                return p >= (t.target || 1);
              }).length;
              const claimedCount = TASK_LIST.filter(t => (dailyTasks.claimed || []).includes(t.id)).length;
              const totalTasks = TASK_LIST.length;
              const displayCount = claimedCount > 0 ? claimedCount : doneCount;
              return displayCount > 0 ? (
                <span className="text-[10px] bg-brand-teal/10 text-brand-teal-dark px-2 py-0.5 rounded-full">{displayCount}/{totalTasks}</span>
              ) : null;
            })()}
            {dailyTasks.streakDay > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🔥×{dailyTasks.streakDay}</span>
            )}
            {Object.values(achievements).filter(Boolean).length > 0 && (
              <span className="text-[10px] bg-brand-gold/10 text-brand-gold-dark px-2 py-0.5 rounded-full">
                {Object.values(achievements).filter(Boolean).length}/{ACHIEVEMENT_LIST.length}徽章
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${showTasks ? "rotate-180" : ""}`} />
          </div>
        </button>

        {showTasks && (
          <div className="px-3 pb-4 space-y-3 border-t border-border-tertiary/40 pt-3">
            {/* 连击状态条 */}
            {dailyTasks.streakDay > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60">
                <span className="text-sm">🔥</span>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold text-amber-700">连击 ×{dailyTasks.streakDay}</div>
                  <div className="text-[8px] text-amber-500">
                    {dailyTasks.streakDay <= 2
                      ? `奖励 +${STREAK_BONUS[dailyTasks.streakDay]*100}%`
                      : `奖励 +${STREAK_BONUS[Math.min(dailyTasks.streakDay,4)]*100}% · 再坚持${7-dailyTasks.streakDay}天`}
                  </div>
                </div>
                <div className="text-[10px] text-amber-600 font-medium">连续完成任务可叠加</div>
              </div>
            )}

            {/* 晨间签到 */}
            <div>
              <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🌅 晨间</div>
              <div className="flex items-center justify-between py-2 px-2 rounded-[8px] bg-gradient-to-r from-amber-50/50 to-white border border-amber-100/50">
                <div className="flex items-center gap-2">
                  <span className="text-base">☀️</span>
                  <div>
                    <div className="text-xs font-medium">晨间签到</div>
                    <div className="text-[9px] text-text-tertiary">新的一天，来签到吧</div>
                  </div>
                </div>
                <div>
                  {dailyTasks.checkedIn ? (
                    <span className="text-[10px] text-text-tertiary">✅ 已签</span>
                  ) : (
                    <button onClick={async () => {
                        try {
                          await fetch(apiBase + "/api/lotto-bet-sync", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: 10, lottery: "task" }),
                          });
                          onSetDailyTasks(prev => ({ ...prev, checkedIn: true, claimed: [...prev.claimed, "checkin"] }));
                          onSetBalance(prev => prev + 10);
                        } catch {}
                      }} className="text-[10px] bg-brand-gold text-white px-3 py-1 rounded-full font-medium active:scale-90">
                      +10🎮 签到
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 核心任务 */}
            <div>
              <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🎮 核心</div>
              {TASK_LIST.filter(t => t.zone === "core").map(t => {
                const progressVal = taskProgress[t.id as keyof typeof taskProgress] || 0;
                const done = progressVal >= (t.target || 1);
                const claimed = (dailyTasks.claimed || []).includes(t.id);
                const streakMult = 1 + (STREAK_BONUS[Math.min(dailyTasks.streakDay, 4)] || 0);
                const rewardVal = Math.floor(t.reward * streakMult);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border-tertiary/20 last:border-0">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{t.label}</div>
                      <div className="text-[9px] text-text-tertiary">{t.desc}</div>
                      {!done && t.target && t.target > 1 && (
                        <div className="mt-1 h-1.5 bg-bg rounded-full overflow-hidden w-24">
                          <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${(progressVal / t.target) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {done ? (
                        claimed ? (
                          <span className="text-[10px] text-text-tertiary">✅ 已领</span>
                        ) : (
                          <button onClick={async () => {
                            try {
                              await fetch(apiBase + "/api/lotto-bet-sync", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: rewardVal, lottery: "task" }),
                              });
                              onSetDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, t.id], chestStars: (prev.chestStars || 0) + (t.target ? 1 : 0) }));
                              onSetBalance(prev => prev + rewardVal);
                            } catch {}
                          }} className="text-[10px] bg-brand-gold text-white px-2.5 py-1 rounded-full font-medium active:scale-90">
                            领 {rewardVal}🎮
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-text-tertiary">{t.target ? `${progressVal}/${t.target}` : "未完成"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 挑战任务 */}
            <div>
              <div className="text-[9px] font-medium text-text-tertiary mb-1.5">🌙 挑战</div>
              {TASK_LIST.filter(t => t.zone === "challenge").map(t => {
                const progressVal = taskProgress[t.id as keyof typeof taskProgress] || 0;
                const done = progressVal >= (t.target || 1);
                const claimed = (dailyTasks.claimed || []).includes(t.id);
                const streakMult = 1 + (STREAK_BONUS[Math.min(dailyTasks.streakDay, 4)] || 0);
                const rewardVal = Math.floor(t.reward * streakMult);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded-[8px] bg-gradient-to-r from-purple-50/50 to-white border border-purple-100/50">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{t.label}</div>
                      <div className="text-[9px] text-text-tertiary">{t.desc}</div>
                      {!done && t.target && t.target > 1 && (
                        <div className="mt-1 h-1.5 bg-bg rounded-full overflow-hidden w-24">
                          <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${(progressVal / t.target) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {done ? (
                        claimed ? (
                          <span className="text-[10px] text-text-tertiary">✅ 已领</span>
                        ) : (
                          <button onClick={async () => {
                            try {
                              await fetch(apiBase + "/api/lotto-bet-sync", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: rewardVal, lottery: "task" }),
                              });
                              onSetDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, t.id], chestStars: (prev.chestStars || 0) + 2 }));
                              onSetBalance(prev => prev + rewardVal);
                            } catch {}
                          }} className="text-[10px] bg-purple-500 text-white px-2.5 py-1 rounded-full font-medium active:scale-90">
                            领 {rewardVal}🎮
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-text-tertiary">{t.target ? `${progressVal}/${t.target}` : "未完成"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 全清奖 */}
            {(() => {
              const allIds = ["checkin","bet3","hotWin","earn50","streak3"];
              const allDone = allIds.every(id => dailyTasks.claimed.includes(id));
              return allDone && !dailyTasks.claimed.includes("all_clear") ? (
                <button onClick={async () => {
                  try {
                    await fetch(apiBase + "/api/lotto-bet-sync", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: BONUS_ALL_CLEAR, lottery: "task" }),
                    });
                    onSetDailyTasks(prev => ({ ...prev, claimed: [...prev.claimed, "all_clear"] }));
                    onSetBalance(prev => prev + BONUS_ALL_CLEAR);
                  } catch {}
                }} className="w-full py-2 rounded-[8px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[11px] font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                  🏆 全清奖励 +{BONUS_ALL_CLEAR}🎮
                </button>
              ) : null;
            })()}

            {/* 宝箱 */}
            <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">{dailyTasks.chestOpened ? "📦" : (dailyTasks.chestStars >= CHEST_COST ? "🎁" : "📦")}</span>
                <div>
                  <div className="text-[10px] font-semibold text-indigo-700">
                    {dailyTasks.chestOpened ? "今日宝箱已开" : (dailyTasks.chestStars >= CHEST_COST ? "可以开宝箱了！" : "完成挑战积攒星星")}
                  </div>
                  <div className="text-[9px] text-indigo-400">⭐ {dailyTasks.chestStars || 0}/{CHEST_COST} (完成挑战+2⭐, 核心+1⭐)</div>
                </div>
              </div>
              {dailyTasks.chestStars >= CHEST_COST && !dailyTasks.chestOpened && (
                <button onClick={async () => {
                  const chestReward = [10, 15, 20, 30, 50, 100, 200][Math.floor(Math.random() * 7)];
                  try {
                    await fetch(apiBase + "/api/lotto-bet-sync", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid: user?.uid || 0, action: "settle", win_amount: chestReward, lottery: "task" }),
                    });
                    onSetDailyTasks(prev => ({ ...prev, chestOpened: true, chestStars: Math.max(0, (prev.chestStars || 0) - CHEST_COST) }));
                    onSetBalance(prev => prev + chestReward);
                  } catch {}
                }} className="text-[10px] bg-indigo-500 text-white px-3 py-1.5 rounded-full font-bold active:scale-90">
                  开宝箱
                </button>
              )}
            </div>

            {/* 成就 */}
            <div>
              <div className="text-xs font-semibold text-text-secondary mb-2">成就徽章 <span className="text-[9px] text-text-tertiary">一次性</span></div>
              <div className="grid grid-cols-3 gap-2">
                {ACHIEVEMENT_LIST.map(a => {
                  const unlocked = achievements[a.id];
                  return (
                    <div key={a.id} className={`p-2 rounded-[8px] text-center ${unlocked ? "bg-brand-gold/10 border border-brand-gold/30" : "bg-bg border border-border-tertiary"}`}>
                      <div className={`text-base ${unlocked ? "" : "grayscale opacity-40"}`}>{a.label.split(" ")[0]}</div>
                      <div className={`text-[9px] mt-0.5 font-medium ${unlocked ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                        {unlocked ? a.label : "???"}
                      </div>
                      {unlocked && <div className="text-[8px] text-text-tertiary mt-0.5">{a.reward}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
