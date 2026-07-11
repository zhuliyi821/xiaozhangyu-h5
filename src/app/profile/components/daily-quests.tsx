"use client";

/** 📋 今日任务：3项任务 + 宝箱进度 + 签到 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/config/api";

interface SignStatus {
  signed_today: boolean;
  current_streak: number;
  today_reward: number;
}

interface TaskDef {
  id: string;
  label: string;
  reward: number;
  exp: number;
  desc: string;
  check: () => Promise<boolean>;
  link?: string;
}

interface Props {
  uid: number;
  onRefreshBalance: () => void;
}

const STREAK_DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function DailyQuests({ uid, onRefreshBalance }: Props) {
  const [signStatus, setSignStatus] = useState<SignStatus | null>(null);
  const [signLoading, setSignLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});
  const [chestOpened, setChestOpened] = useState(false);

  // 签到状态
  const fetchSign = useCallback(async () => {
    try {
      const d = await apiFetch<SignStatus>(`/api/sign?uid=${uid}`);
      setSignStatus(d);
    } catch {} finally { setSignLoading(false); }
  }, [uid]);

  useEffect(() => { fetchSign(); }, [fetchSign]);

  const handleSign = async () => {
    if (signing || signStatus?.signed_today) return;
    setSigning(true);
    try {
      await apiFetch("/api/sign", { method: "POST", body: JSON.stringify({ uid }) });
      onRefreshBalance();
      await fetchSign();
    } catch {} finally { setSigning(false); }
  };

  const signed = signStatus?.signed_today ?? false;
  const streak = signStatus?.current_streak ?? 0;

  // Fetch real task data from API
  const [taskData, setTaskData] = useState<any>(null);
  useEffect(() => {
    if (!uid) return;
    apiFetch<any>(`/api/tasks?uid=${uid}`)
      .then(d => setTaskData(d))
      .catch(() => {});
  }, [uid, signed]);

  // Tasks
  const tasks: TaskDef[] = [
    {
      id: "bet3", label: "完成 3 次预测", reward: 500, exp: 20,
      desc: "参与任意预测",
      check: async () => {
        // Check from tasks API - bet count
        const firstBet = taskData?.tasks?.find((t: any) => t.task_key === "first_bet");
        return firstBet?.user_progress > 0 || false;
      },
    },
    {
      id: "sign", label: "签到领豆", reward: 200, exp: 0,
      desc: "每日签到",
      check: async () => signed,
    },
    {
      id: "pk1", label: "参与 1 次 PK", reward: 500, exp: 30,
      desc: "挑战其他玩家",
      check: async () => {
        const pkTask = taskData?.tasks?.find((t: any) => t.task_key === "pk_beginner");
        return pkTask?.user_progress > 0 || false;
      },
      link: "/pk-hall",
    },
  ];

  useEffect(() => {
    // Update task states from real data
    const firstBet = taskData?.tasks?.find((t: any) => t.task_key === "first_bet");
    const pkTask = taskData?.tasks?.find((t: any) => t.task_key === "pk_beginner");
    setTaskStates({
      bet3: firstBet?.user_progress > 0 || false,
      sign: signed,
      pk1: pkTask?.user_progress > 0 || false,
    });
  }, [taskData, signed]);

  const doneCount = Object.values(taskStates).filter(Boolean).length;
  const total = tasks.length;
  const chestReady = doneCount >= 2 && !chestOpened;

  const toggleTask = (id: string) => {
    if (taskStates[id]) return;
    setTaskStates(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="mx-4 mt-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <span style={{fontSize:13,fontWeight:500}}>📋 今日任务</span>
        <span style={{fontSize:10,color:'#8E8E93'}}>
          {doneCount}/{total} 完成·刷新 8h
        </span>
      </div>

      {/* Task Items */}
      {tasks.map(t => {
        const done = taskStates[t.id] || false;
        return (
          <div
            key={t.id}
            onClick={() => { if (!done) toggleTask(t.id); }}
            style={{
              display:'flex',alignItems:'center',gap:10,
              background:'#fff',borderRadius:10,padding:'10px 12px',
              marginBottom:5,border:'1px solid #E5E5EA',
              opacity: done ? 0.6 : 1,
              cursor:'pointer',
            }}
          >
            <div style={{
              width:18,height:18,borderRadius:'50%',
              border:`2px solid ${done ? '#45CCD5' : '#45CCD5'}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              background: done ? '#45CCD5' : 'transparent',
              color:'#fff',fontSize:10,
            }}>
              {done ? '✓' : ''}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:500}}>{t.label}</div>
              <div style={{fontSize:9,color:'#636366'}}>+{t.reward}🎮 {t.exp > 0 ? `· +${t.exp}EXP` : ''}</div>
            </div>
            <div style={{fontSize:9,color: done ? '#2BAAAF' : '#8E8E93'}}>
              {done ? '已完成 ✓' : (t.link ? '去挑战 →' : '去做 →')}
            </div>
          </div>
        );
      })}

      {/* Chest Bottom Bar */}
      <div style={{
        background:'#fff',borderRadius:10,padding:'10px 12px',
        border:'1px solid #E5E5EA',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{fontSize:10,display:'flex',alignItems:'center',gap:6}}>
          <span>📦 每日宝箱</span>
          <div style={{
            width:80,height:5,background:'#E5E5EA',borderRadius:4,overflow:'hidden',
          }}>
            <div style={{
              height:'100%',
              background:'linear-gradient(90deg,#F2B631,#D99A0F)',
              borderRadius:4,
              width:`${Math.round(doneCount/total*100)}%`,
            }} />
          </div>
          <span style={{fontSize:9,color:'#8E8E93'}}>{doneCount}/{total}</span>
        </div>
        <button
          onClick={() => { if (chestReady) { setChestOpened(true); }}}
          style={{
            background: chestReady
              ? 'linear-gradient(135deg,#F2B631,#D99A0F)'
              : '#E5E5EA',
            color: chestReady ? '#fff' : '#8E8E93',
            border:'none',padding:'5px 14px',borderRadius:10,
            fontSize:10,fontWeight:500,cursor: chestReady ? 'pointer' : 'default',
          }}
        >
          🎁 {chestOpened ? '已开启' : (chestReady ? '开启' : '进行中')}
        </button>
      </div>

      {/* Link to full task center */}
      <div style={{ marginTop: 6, textAlign: 'center' }}>
        <span
          onClick={() => window.location.href = '/tasks'}
          style={{ fontSize: 9, color: '#45CCD5', cursor: 'pointer' }}
        >
          查看全部任务 →
        </span>
      </div>

      {/* Check-in Streak */}
      {!signLoading && (
        <div style={{
          marginTop:8,display:'flex',alignItems:'center',gap:8,
          background:'#fff',borderRadius:10,padding:'10px 12px',
          border:'1px solid #E5E5EA',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:2}}>
            <span style={{fontSize:13}}>🔥</span>
            <span style={{fontSize:10,fontWeight:500}}>连续 {streak} 天</span>
          </div>
          <div style={{display:'flex',gap:2,flex:1}}>
            {STREAK_DAYS.map(d => (
              <div key={d} style={{
                width:20,height:4,borderRadius:4,
                background: d <= streak ? '#F2B631' : '#E5E5EA',
                transition:'background 0.3s',
              }} />
            ))}
          </div>
          <button
            onClick={handleSign}
            disabled={signed || signing}
            style={{
              background: signed ? '#E5E5EA' : '#F2B631',
              color: signed ? '#8E8E93' : '#fff',
              border:'none',padding:'4px 12px',borderRadius:8,
              fontSize:10,fontWeight:500,cursor: signed ? 'default' : 'pointer',
              transition:'transform 0.15s',
            }}
          >
            {signing ? '签到中...' : signed ? '已签到' : '签到'}
          </button>
          {streak >= 6 && (
            <span style={{fontSize:9,color:'#D45435'}}>明日双倍 🎉</span>
          )}
        </div>
      )}
    </div>
  );
}
