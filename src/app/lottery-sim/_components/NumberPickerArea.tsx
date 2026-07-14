"use client";

import { useState, useRef } from "react";

interface LotteryConfig {
  name: string; code: string; front_name: string; front_range: number; front_pick: number;
  back_name: string | null; back_range: number; back_pick: number; price: number; source: string;
  tiers: Array<{ tier: number; name: string; desc: string; odds: string; amount: number }>;
}

interface NumberPickerProps {
  config: LotteryConfig;
  selectedFront: number[];
  selectedBack: number[];
  onSelectFront: (v: number[] | ((prev: number[]) => number[])) => void;
  onSelectBack: (v: number[] | ((prev: number[]) => number[])) => void;
  trendData: Record<number, string>;
  trendDataBack: Record<number, string>;
  frontStats: Array<{number:number; count:number; rate:number; z:number; status:string}>;
  backStats: Array<{number:number; count:number; rate:number; z:number; status:string}>;
  recommendations: Array<{strategy:string; label:string; front:number[]; back:number[]}>;
  onToggleNumber: (n: number, isFront: boolean) => void;
  onDetail: (num: number, data: any) => void;
  onQuickPick: () => void;
  onAddTicket: () => void;
  onPlaceBet: () => Promise<void>;
  onSetTickets: (v: any[] | ((prev: any[]) => any[])) => void;
  onSetBetMultiple: (v: number | ((prev: number) => number)) => void;
  lotteryCode: string;
  apiBase: string;
  onSetError: (msg: string) => void;
}

export default function NumberPickerArea({
  config, selectedFront, selectedBack, onSelectFront, onSelectBack,
  trendData, trendDataBack, frontStats, backStats, recommendations,
  onToggleNumber, onDetail, onQuickPick, onAddTicket, onPlaceBet,
  onSetTickets, onSetBetMultiple, lotteryCode, apiBase, onSetError,
}: NumberPickerProps) {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [backFilterStatus, setBackFilterStatus] = useState<string | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressed, setLongPressed] = useState<number | null>(null);

  const RENDERED_FRONT_FILTERS = [
    { key: 'scorching', label: '超热', color: '#F27152', bg: 'rgba(242,113,82,0.1)' },
    { key: 'hot', label: '热', color: '#F27152', bg: 'rgba(242,113,82,0.08)' },
    { key: 'cold', label: '冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.1)' },
    { key: 'icy', label: '极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.15)' },
  ];

  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
      {/* 前区标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{config.front_name}</span>
          <span className="text-[10px] text-text-tertiary">选 {config.front_pick} 个 (1-{config.front_range})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {RENDERED_FRONT_FILTERS.map(g => (
            <button key={g.key} onClick={() => setFilterStatus(filterStatus === g.key ? null : g.key)}
              className="text-[8px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full active:scale-90 transition-all"
              style={{
                backgroundColor: filterStatus === g.key ? g.color : g.bg,
                color: filterStatus === g.key ? 'white' : g.color,
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === g.key ? 'bg-white/80' : ''}`}
                style={{backgroundColor: filterStatus === g.key ? undefined : g.color}} />
              {g.label}
              {filterStatus === g.key && <span className="ml-0.5">✕</span>}
            </button>
          ))}
          <button onClick={() => setShowStatsPanel(!showStatsPanel)}
            className="text-[9px] px-1.5 py-0.5 rounded-full border border-border-tertiary/50 flex items-center gap-0.5 active:scale-90 transition-transform"
            style={{color: showStatsPanel ? '#F27152' : undefined, borderColor: showStatsPanel ? '#F27152' : undefined}}>
            <span>📊</span><span className="text-[8px]">{showStatsPanel ? '收起' : '分析'}</span>
          </button>
          <span className="text-xs font-semibold ml-0.5">{selectedFront.length}/{config.front_pick}</span>
        </div>
      </div>

      {/* 前区号码球网格 */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: config.front_range }, (_, i) => i + 1).map(n => {
          const isSelected = selectedFront.includes(n);
          const trend = trendData[n];
          const isFiltered = filterStatus !== null && trend !== filterStatus && !isSelected;
          let ballStyle = "bg-bg text-text-secondary border border-border-tertiary";
          let badge: React.ReactNode = null;
          if (isSelected) {
            ballStyle = "bg-[#F27152] text-white shadow-sm scale-110 border-2 border-[#F27152]";
          } else if (trend === 'scorching') {
            ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#F27152] font-bold border-2 border-[#F27152] ring-1 ring-[#F27152]/30";
            if (!isFiltered) badge = <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold leading-none text-white bg-[#F27152] rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">火</span>;
          } else if (trend === 'hot') {
            ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#F27152] font-semibold border-2 border-[#F27152]/60";
            if (!isFiltered) badge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#F27152]" />;
          } else if (trend === 'icy') {
            ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-[#45CCD5]/10 text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
            if (!isFiltered) badge = <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">冰</span>;
          } else if (trend === 'cold') {
            ballStyle = isFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
            if (!isFiltered) badge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
          } else if (isFiltered) {
            ballStyle = "bg-gray-50 text-gray-300 border border-gray-200";
          }
          return (
            <button key={n} onClick={() => {
              if (longPressed === n) { setLongPressed(null); return; }
              onToggleNumber(n, true);
            }}
              onPointerDown={() => {
                longPressRef.current = setTimeout(() => {
                  setLongPressed(n);
                  const stat = frontStats.find(s => s.number === n);
                  if (stat) { onDetail(n, stat); }
                }, 400);
              }}
              onPointerUp={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
              onPointerLeave={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
              className={`relative w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all overflow-visible ${ballStyle}`}
              style={{opacity: isFiltered ? 0.35 : 1}}>
              {String(n).padStart(2, "0")}
              {badge}
            </button>
          );
        })}
      </div>

      {/* 已选号码冷热分析 */}
      {selectedFront.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[10px]">
          <span className="text-text-tertiary shrink-0">已选:</span>
          {selectedFront.map(n => {
            const t = trendData[n] || 'normal';
            let dotColor = '#8E8E93';
            let label = '常规';
            if (t === 'scorching') { dotColor = '#F27152'; label = '超热'; }
            else if (t === 'hot') { dotColor = '#F27152'; label = '热'; }
            else if (t === 'icy') { dotColor = '#45CCD5'; label = '极冷'; }
            else if (t === 'cold') { dotColor = '#45CCD5'; label = '冷'; }
            return (
              <span key={n} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white border border-border-tertiary/60">
                <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: dotColor}} />
                <span className="text-[9px] font-medium">{String(n).padStart(2,"0")}</span>
                <span className="text-[8px] text-text-tertiary">{label}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* 前区冷热分析面板 */}
      {showStatsPanel && frontStats.length > 0 && (
        <div className="mt-3 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50">
          <div className="grid grid-cols-5 gap-px bg-border-tertiary/30">
            {[
              { key: 'scorching', label: '🔥超热', color: '#F27152', bg: 'rgba(242,113,82,0.08)' },
              { key: 'hot', label: '🔥热', color: '#F27152', bg: 'rgba(242,113,82,0.05)' },
              { key: 'normal', label: '🌡️常', color: '#8E8E93', bg: 'transparent' },
              { key: 'cold', label: '❄️冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
              { key: 'icy', label: '❄️极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
            ].map(g => {
              const items = frontStats.filter(s => s.status === g.key);
              return (
                <div key={g.key} className="p-2 text-center" style={{backgroundColor: g.bg}}>
                  <div className="text-[13px] font-bold" style={{color: g.color}}>{items.length}</div>
                  <div className="text-[8px] text-text-tertiary mt-0.5">{g.label}</div>
                  {items.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {items.slice(0, 4).map(s => (
                        <button key={s.number} onClick={() => onDetail(s.number, s)}
                          className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold active:scale-90"
                          style={{backgroundColor: g.color+'20', color: g.color}}>
                          {s.number}
                        </button>
                      ))}
                      {items.length > 4 && <span className="text-[8px] text-text-tertiary">+{items.length-4}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 后区冷热分析面板 */}
      {showStatsPanel && backStats.length > 0 && config.back_pick > 0 && (
        <div className="mt-2 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50">
          <div className="grid grid-cols-5 gap-px bg-border-tertiary/30">
            {[
              { key: 'scorching', label: '🔥超热', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
              { key: 'hot', label: '🔥热', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
              { key: 'normal', label: '🌡️常', color: '#8E8E93', bg: 'transparent' },
              { key: 'cold', label: '❄冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.05)' },
              { key: 'icy', label: '❄极冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
            ].map(g => {
              const items = backStats.filter(s => s.status === g.key);
              return (
                <div key={g.key} className="p-2 text-center" style={{backgroundColor: g.bg}}>
                  <div className="text-[12px] font-bold" style={{color: g.color}}>{items.length}</div>
                  <div className="text-[7px] text-text-tertiary mt-0.5">{g.label}</div>
                  {items.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {items.slice(0, 4).map(s => (
                        <button key={s.number} onClick={() => onDetail(s.number, s)}
                          className="text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold active:scale-90"
                          style={{backgroundColor: g.color+'20', color: g.color}}>
                          {s.number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 号码频率柱状图 */}
      {showStatsPanel && frontStats.length > 0 && (
        <div className="mt-3 rounded-[8px] border border-border-tertiary overflow-hidden bg-bg/50 p-3">
          <div className="text-[10px] font-semibold text-text-secondary mb-2 flex items-center gap-1">
            <span>📈</span> 号码频率分布 <span className="text-[8px] text-text-tertiary">(近{frontStats.reduce((s,f)=>s+f.count,0)}次出现)</span>
          </div>
          <div className="space-y-[2px] max-h-[160px] overflow-y-auto">
            {[...frontStats].sort((a,b) => a.number - b.number).map(s => {
              const maxCount = Math.max(...frontStats.map(f => f.count));
              const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
              const barColor = s.status === 'scorching' ? '#F27152' :
                s.status === 'hot' ? '#F27152' :
                s.status === 'icy' ? '#45CCD5' :
                s.status === 'cold' ? '#45CCD5' : '#D1D5DB';
              return (
                <div key={s.number} className="flex items-center gap-1.5">
                  <span className="text-[9px] w-5 text-right font-mono text-text-secondary">{String(s.number).padStart(2,"0")}</span>
                  <div className="flex-1 h-3 rounded-[3px] bg-gray-100 overflow-hidden relative">
                    <div className="h-full rounded-[3px] transition-all" style={{width: `${pct}%`, backgroundColor: barColor, opacity: pct > 50 ? 0.8 : 0.5}} />
                  </div>
                  <span className="text-[8px] w-5 text-right text-text-tertiary">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 后区号码选择 */}
      {config.back_pick > 0 && (
        <>
          <div className="flex items-center justify-between mt-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{config.back_name}</span>
              <span className="text-[10px] text-text-tertiary">选 {config.back_pick} 个 (1-{config.back_range})</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: 'hot', label: '热', color: '#45CCD5', bg: 'rgba(69,204,213,0.08)' },
                { key: 'cold', label: '冷', color: '#45CCD5', bg: 'rgba(69,204,213,0.12)' },
              ].map(g => (
                <button key={g.key} onClick={() => setBackFilterStatus(backFilterStatus === g.key ? null : g.key)}
                  className="text-[8px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full active:scale-90 transition-all"
                  style={{
                    backgroundColor: backFilterStatus === g.key ? g.color : g.bg,
                    color: backFilterStatus === g.key ? 'white' : g.color,
                  }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${backFilterStatus === g.key ? 'bg-white/80' : ''}`}
                    style={{backgroundColor: backFilterStatus === g.key ? undefined : g.color}} />
                  {g.label}
                  {backFilterStatus === g.key && <span className="ml-0.5">✕</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: config.back_range }, (_, i) => i + 1).map(n => {
              const isSelected = selectedBack.includes(n);
              const trend = trendDataBack[n];
              const backIsFiltered = backFilterStatus !== null && trend !== backFilterStatus && !isSelected;
              let backBallStyle = "bg-bg text-text-secondary border border-border-tertiary";
              let backBadge: React.ReactNode = null;
              if (isSelected) {
                backBallStyle = "bg-[#45CCD5] text-white shadow-sm scale-110 border-2 border-[#45CCD5]";
              } else if (trend === 'scorching') {
                backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
                if (!backIsFiltered) backBadge = <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3 h-3 flex items-center justify-center shadow-sm">火</span>;
              } else if (trend === 'hot') {
                backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
                if (!backIsFiltered) backBadge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
              } else if (trend === 'icy') {
                backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-[#45CCD5]/10 text-[#45CCD5] font-bold border-2 border-[#45CCD5]";
                if (!backIsFiltered) backBadge = <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold leading-none text-white bg-[#45CCD5] rounded-full w-3 h-3 flex items-center justify-center shadow-sm">冰</span>;
              } else if (trend === 'cold') {
                backBallStyle = backIsFiltered ? "bg-gray-50 text-gray-300 border border-gray-200" : "bg-bg text-[#45CCD5] font-semibold border-2 border-[#45CCD5]/60";
                if (!backIsFiltered) backBadge = <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] rounded-full bg-[#45CCD5]" />;
              } else if (backIsFiltered) {
                backBallStyle = "bg-gray-50 text-gray-300 border border-gray-200";
              }
              return (
                <button key={n} onClick={() => {
                  if (longPressed === n) { setLongPressed(null); return; }
                  onToggleNumber(n, false);
                }}
                  onPointerDown={() => {
                    longPressRef.current = setTimeout(() => {
                      setLongPressed(n);
                      const bStat = backStats.find(s => s.number === n);
                      if (bStat) { onDetail(n, bStat); }
                      else {
                        const status = trendDataBack[n] || 'normal';
                        onDetail(n, {number: n, count: 0, rate: 0, z: 0, status});
                      }
                    }, 400);
                  }}
                  onPointerUp={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                  onPointerLeave={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                  className={`relative w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center active:scale-90 transition-all overflow-visible ${backBallStyle}`}
                  style={{opacity: backIsFiltered ? 0.35 : 1}}>
                  {String(n).padStart(2, "0")}
                  {backBadge}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 智能选号建议 */}
      {recommendations.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {recommendations.map(r => {
            const emoji = r.strategy === 'chase_hot' ? '🔥' : r.strategy === 'chase_cold' ? '❄️' : '⚖️';
            const colorClass = r.strategy === 'chase_hot' ? 'bg-red-50 border-red-200 text-red-600' : 
              r.strategy === 'chase_cold' ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 
              'bg-amber-50 border-amber-200 text-amber-700';
            return (
              <button key={r.strategy} onClick={() => {
                onSelectFront(r.front);
                onSelectBack(r.back || []);
              }}
                className={`flex-1 py-1.5 rounded-[8px] text-[10px] font-medium active:scale-95 transition-all border ${colorClass}`}>
                {emoji} {r.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 快捷参与按钮 */}
      <div className="mt-2 flex gap-1.5">
        <button onClick={async () => {
          try {
            const q = await fetch(apiBase + "/api/lotto/quick-pick?code=" + lotteryCode).then(r => r.json());
            if (q.code !== 0) return;
            const t = q.data.ticket;
            const front = t.front || t.digits || [];
            const back = t.back || [];
            onSetTickets([{front, back}]);
            onSetBetMultiple(1);
            await new Promise(r => setTimeout(r, 60));
            onPlaceBet();
          } catch {}
        }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal/80 to-brand-teal text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
          ⚡ 机选1注
        </button>
        <button onClick={async () => {
          try {
            const tickets: Array<{front: number[]; back: number[]}> = [];
            for (let i = 0; i < 5; i++) {
              const q = await fetch(apiBase + "/api/lotto/quick-pick?code=" + lotteryCode).then(r => r.json());
              if (q.code !== 0) continue;
              const t = q.data.ticket;
              tickets.push({ front: t.front || t.digits || [], back: t.back || [] });
            }
            if (tickets.length > 0) {
              onSetTickets(tickets);
              onSetBetMultiple(1);
              await new Promise(r => setTimeout(r, 60));
              onPlaceBet();
            }
          } catch {}
        }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
          ⚡ 机选5注
        </button>
        <button onClick={async () => {
          const hotRec = recommendations.find(r => r.strategy === 'chase_hot');
          if (hotRec && hotRec.front.length > 0) {
            onSetTickets([{front: hotRec.front, back: hotRec.back || []}]);
            onSetBetMultiple(1);
            await new Promise(r => setTimeout(r, 60));
            onPlaceBet();
          }
        }} className="flex-1 py-2 rounded-[8px] bg-gradient-to-r from-red-400 to-red-500 text-white text-[10px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1">
          ⚡ 追热1注
        </button>
      </div>

      {/* 机选+加号 */}
      <div className="flex gap-2 mt-4">
        <button onClick={onQuickPick}
          className="flex-1 py-2 rounded-[8px] bg-bg text-text-secondary text-xs font-medium border border-border-tertiary flex items-center justify-center gap-1 active:scale-95 transition-transform">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg> 机选
        </button>
        <button onClick={onAddTicket}
          className="flex-1 py-2 rounded-[8px] bg-brand-teal-light/30 text-brand-teal-dark text-xs font-medium border border-brand-teal/30 flex items-center justify-center gap-1 active:scale-95 transition-transform">
          + 选号 ({(config?.price || 100) * 1}🎮)
        </button>
      </div>
    </div>
  );
}
