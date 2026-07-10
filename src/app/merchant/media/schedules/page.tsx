"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA", green: "#10B981" };
const PLATFORMS = [
  { key: "wechat", icon: "📰", label: "公众号", color: C.green },
  { key: "xiaohongshu", icon: "📕", label: "小红书", color: C.coral },
  { key: "douyin", icon: "🎬", label: "抖音", color: C.purple },
  { key: "digital_human", icon: "🎙️", label: "数字人", color: C.gold },
];
const TIME_OPTIONS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

export default function MediaSchedulesPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [storeId, setStoreId] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // platform key

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          const id = d.data.stores[0].id;
          setStoreId(id);
          loadSchedules(id);
        }
      })
      .catch(() => setShowLogin(true));
  }, [user]);

  const loadSchedules = (sid: number) => {
    fetch(`${API_BASE}/api/store-media?action=schedules&store_id=${sid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setSchedules(d.data || []); })
      .catch(() => {});
  };

  const getSchedule = (platform: string) => schedules.find(s => s.platform === platform);

  const save = async (platform: string, timeSlot: string, count: number) => {
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=schedule_save`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, platform, time_slot: timeSlot + ":00", count_per_day: count }),
      });
      const d = await r.json();
      setMsg(d.msg || "已保存");
      loadSchedules(storeId);
      setEditing(null);
    } catch { setMsg("保存失败"); }
  };

  const remove = async (id: number) => {
    await fetch(`${API_BASE}/api/store-media?action=schedule_delete&id=${id}`, { method: "GET" });
    loadSchedules(storeId);
  };

  if (loading) return <main className="min-h-screen bg-[#F5F6FA] p-4"><div className="animate-pulse h-8 bg-gray-200 rounded w-1/2" /></main>;
  if (!user) return <main className="min-h-screen bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="p-4 text-brand-teal">登录后查看</button><LoginModal onClose={() => setShowLogin(false)} /></main>;

  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold">定时发布规则</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">设置各平台每日定时发布计划</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mx-4 mt-3 p-2 bg-brand-teal/10 rounded-[8px] text-[11px] text-brand-teal-dark text-center" onClick={() => setMsg("")}>{msg}</div>
      )}

      {/* Platform schedule cards */}
      <div className="mx-4 mt-4 space-y-3">
        {PLATFORMS.map(p => {
          const sched = getSchedule(p.key);
          const isEditing = editing === p.key;

          return (
            <div key={p.key} className="bg-white rounded-[12px] p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {sched ? `每天 ${sched.time_slot.slice(0,5)} · ${sched.count_per_day}篇` : "未配置"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sched && sched.is_active == 1 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600">已启用</span>
                  )}
                  {!isEditing && (
                    <button onClick={() => setEditing(p.key)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 active:scale-90">
                      {sched ? "编辑" : "配置"}
                    </button>
                  )}
                  {sched && !isEditing && (
                    <button onClick={() => remove(sched.id)} className="text-[11px] text-gray-300 active:scale-90">✕</button>
                  )}
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <ScheduleForm
                  platform={p.key}
                  platformLabel={p.label}
                  defaultTime={sched?.time_slot?.slice(0,5) || "08:00"}
                  defaultCount={sched?.count_per_day || 3}
                  onSave={(time, count) => save(p.key, time, count)}
                  onCancel={() => setEditing(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-brand-teal/5 to-brand-teal/10 rounded-[12px] p-4 border border-brand-teal/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">⏰</span>
          <span className="text-xs font-semibold">今日发布计划</span>
        </div>
        {schedules.filter(s => s.is_active == 1).length === 0 ? (
          <div className="text-[11px] text-gray-400">暂无定时规则，请配置各平台发布计划</div>
        ) : (
          schedules.filter(s => s.is_active == 1).map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 text-[11px]">
              <span>{PLATFORMS.find(p => p.key === s.platform)?.icon} {PLATFORMS.find(p => p.key === s.platform)?.label}</span>
              <span className="text-gray-500">{s.time_slot.slice(0,5)} · {s.count_per_day}篇</span>
              <span className={s.last_run ? "text-green-500" : "text-amber-500"}>
                {s.last_run ? "✅ 今日已处理" : "⏳ 等待执行"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Back link */}
      <div className="mx-4 mt-4">
        <a href="/merchant/media" className="text-[11px] text-brand-teal">← 返回内容管理</a>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

function ScheduleForm({ platform, platformLabel, defaultTime, defaultCount, onSave, onCancel }: {
  platform: string; platformLabel: string; defaultTime: string; defaultCount: number;
  onSave: (time: string, count: number) => void; onCancel: () => void;
}) {
  const [time, setTime] = useState(defaultTime);
  const [count, setCount] = useState(defaultCount);

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
      <div>
        <div className="text-[10px] text-gray-400 mb-1">发布时间</div>
        <select value={time} onChange={e => setTime(e.target.value)}
          className="w-full p-2 rounded-[8px] border border-gray-200 text-sm bg-white">
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 mb-1">每日篇数</div>
        <div className="flex gap-2">
          {[1, 2, 3, 5].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`flex-1 py-2 rounded-[8px] text-xs font-medium active:scale-90 transition-all ${
                count === n ? "text-white" : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
              style={count === n ? { background: C.teal } : {}}>
              {n}篇
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 rounded-[8px] text-xs border border-gray-200 active:scale-90">取消</button>
        <button onClick={() => onSave(time, count)}
          className="flex-1 py-2 rounded-[8px] text-xs text-white font-medium active:scale-90"
          style={{background: C.teal}}>
          保存规则
        </button>
      </div>
    </div>
  );
}
