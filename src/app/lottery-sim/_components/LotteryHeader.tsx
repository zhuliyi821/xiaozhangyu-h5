"use client";

import { ArrowLeft } from "lucide-react";

interface LotteryHeaderProps {
  lotteryCode: string;
  setLotteryCode: (code: string) => void;
  confirmSwitch: string | null;
  setConfirmSwitch: (code: string | null) => void;
  trackModeSwitch: () => void;
  tickets: any[];
  setTickets: (t: any[]) => void;
  user: any;
  balance: number;
  jackpot: number;
  onSidePanel?: () => void;
}

const LOTTERY_LIST = [
  { code: "ssq", name: "红蓝碰", icon: "🔴", color: "from-red-500 to-rose-500" },
  { code: "dlt", name: "双区碰", icon: "🔵", color: "from-blue-500 to-cyan-500" },
  { code: "fc3d", name: "三顺碰", icon: "🟢", color: "from-green-500 to-emerald-500" },
  { code: "pl3", name: "排列碰", icon: "🟣", color: "from-purple-500 to-violet-500" },
  { code: "qxc", name: "七星碰", icon: "🔶", color: "from-orange-500 to-amber-500" },
];

export default function LotteryHeader({
  lotteryCode, setLotteryCode, confirmSwitch, setConfirmSwitch,
  trackModeSwitch, tickets, setTickets, user, balance, jackpot, onSidePanel,
}: LotteryHeaderProps) {
  return (
    <>
      {/* 顶部渐变头 — 统一品牌色 */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-5 rounded-b-[28px] shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-[15px] font-medium text-white">数字碰</h1>
              <p className="text-[10px] text-white/60">选号碰 · 一秒开奖</p>
            </div>
            <a href={"/lottery?type=" + lotteryCode}
              className="ml-2 px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-medium flex items-center gap-1 active:scale-90 transition-transform whitespace-nowrap">
              <span>📊</span><span>走势</span>
            </a>
            {onSidePanel && (
              <button onClick={onSidePanel}
                className="ml-1 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs active:scale-90 transition-transform">
                ☰
              </button>
            )}
          </div>
          <div className="text-right text-white">
            <div className="text-[9px] opacity-50">{user ? "游戏豆" : "未登录"}</div>
            <div className="text-sm font-bold">{user ? balance.toLocaleString() : "—"} 🎮</div>
          </div>
        </div>

        {/* 奖金池 */}
        <div className="text-center mt-3 pt-2 border-t border-white/10 relative z-10">
          <div className="text-[9px] text-white/40 tracking-[1px]">当前奖金池</div>
          <div className="text-[22px] font-bold text-brand-gold tracking-[1px] mt-0.5">{Math.floor(jackpot).toLocaleString()} 🎮</div>
          <div className="text-[9px] text-white/30 mt-0.5">人人可中 · 上不封顶</div>
        </div>
      </div>

      {/* 彩种选择栏 */}
      <div className="px-4 -mt-3 relative z-20">
        <div className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary mb-3">
          <div className="grid grid-cols-5 gap-1.5">
            {LOTTERY_LIST.map(l => (
              <button key={l.code} onClick={() => {
                  if (tickets.length > 0) { setConfirmSwitch(l.code); return; }
                  setLotteryCode(l.code); setTickets([]); trackModeSwitch();
                }}
                className={`py-2.5 rounded-[8px] text-center active:scale-95 transition-all ${
                  lotteryCode === l.code
                    ? `bg-gradient-to-r ${l.color} text-white shadow-sm`
                    : "bg-bg text-text-secondary border border-border-tertiary"
                }`}>
                <div className="text-lg">{l.icon}</div>
                <div className="text-[9px] font-semibold mt-0.5">{l.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
