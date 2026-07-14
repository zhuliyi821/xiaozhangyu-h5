"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";
import { C } from "@/lib/brand-colors";


export default function MediaAnalyticsPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0, published: 0 });
  const [contents, setContents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          const sid = d.data.stores[0].id;
          fetch(`${API_BASE}/api/store-media?action=overview&store_id=${sid}`)
            .then(r => r.json()).then(j => { if (j.code === 0) setStats(j.data); }).catch(() => {});
          fetch(`${API_BASE}/api/store-media?action=contents&store_id=${sid}&limit=50`)
            .then(r => r.json()).then(j => { if (j.code === 0) setContents(j.data.list || []); }).catch(() => {});
        }
      }).catch(() => {});
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  const platformData = [{ key:"wechat", icon:"📰", label:"公众号", color:C.green },
    { key:"xiaohongshu", icon:"📕", label:"小红书", color:C.coral },
    { key:"douyin", icon:"🎬", label:"抖音", color:C.purple },
    { key:"digital_human", icon:"🎙️", label:"数字人", color:C.gold }].map(p => ({
      ...p, count: contents.filter(c => c.platform === p.key).length,
      published: contents.filter(c => c.platform === p.key && c.status === "published").length,
    }));

  const published = contents.filter(c => c.status === "published");

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>数据看板</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">运营数据 · 内容分析</p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-[12px] p-4 text-center shadow-sm">
          <div className="text-2xl font-bold" style={{color:C.teal}}>{stats.total}</div>
          <div className="text-[10px] text-gray-400 mt-1">总内容</div>
        </div>
        <div className="bg-white rounded-[12px] p-4 text-center shadow-sm">
          <div className="text-2xl font-bold" style={{color:C.green}}>{stats.published}</div>
          <div className="text-[10px] text-gray-400 mt-1">已发布</div>
        </div>
        <div className="bg-white rounded-[12px] p-4 text-center shadow-sm">
          <div className="text-2xl font-bold" style={{color:C.coral}}>{stats.today}</div>
          <div className="text-[10px] text-gray-400 mt-1">今日新增</div>
        </div>
      </div>

      {/* 7天趋势图 */}
      <div className="mx-4 mt-4 bg-white rounded-[12px] p-4 shadow-sm">
        <h2 className="text-[12px] font-medium text-gray-400 mb-3">近7日发布趋势</h2>
        {(() => {
          const days: {label:string; count:number}[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0,10);
            const label = `${d.getMonth()+1}/${d.getDate()}`;
            const count = contents.filter(c => c.created_at && new Date(c.created_at * 1000).toISOString().slice(0,10) === dateStr).length;
            days.push({ label, count });
          }
          const max = Math.max(...days.map(d => d.count), 1);
          return (
            <div className="flex items-end gap-2 h-24">
              {days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-gray-300">{d.count || ""}</span>
                  <div className="w-full rounded-t-[4px] transition-all" style={{height:`${(d.count/max)*100}%`, backgroundColor: d.count > 0 ? C.teal : "#f0f0f0", minHeight: d.count > 0 ? 4 : 2}} />
                  <span className="text-[8px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Platform breakdown */}
      <div className="mx-4 mt-4">
        <h2 className="text-[12px] font-medium text-gray-400 mb-2.5 px-0.5">各平台内容分布</h2>
        <div className="space-y-2">
          {platformData.map(p => (
            <div key={p.key} className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3">
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium">{p.label}</span>
                  <span style={{color:p.color}}>{p.published}/{p.count} 已发布</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{width:`${p.count ? (p.published/p.count*100) : 0}%`, backgroundColor:p.color}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 状态分布 */}
      <div className="mx-4 mt-4 bg-white rounded-[12px] p-4 shadow-sm">
        <h2 className="text-[12px] font-medium text-gray-400 mb-3">内容状态分布</h2>
        {(() => {
          const pending = contents.filter(c => c.status === "pending").length;
          const approved = contents.filter(c => c.status === "approved").length;
          const pub = contents.filter(c => c.status === "published").length;
          const rej = contents.filter(c => c.status === "rejected").length;
          const total = pending + approved + pub + rej || 1;
          const bars = [
            { label: "待审核", count: pending, color: C.gold },
            { label: "已通过", count: approved, color: C.green },
            { label: "已发布", count: pub, color: C.teal },
            { label: "已驳回", count: rej, color: "#999" },
          ].filter(b => b.count > 0);
          return (
            <div className="space-y-2">
              <div className="flex h-3 rounded-full overflow-hidden">
                {bars.map((b, i) => <div key={i} style={{width:`${(b.count/total)*100}%`, backgroundColor:b.color, minWidth:4}} />)}
              </div>
              <div className="flex flex-wrap gap-3">
                {bars.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor:b.color}} />
                    <span className="text-gray-500">{b.label}</span>
                    <span className="font-medium">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Recent publications */}
      <div className="mx-4 mt-4">
        <h2 className="text-[12px] font-medium text-gray-400 mb-2.5 px-0.5">最近发布</h2>
        {published.length === 0 ? (
          <div className="text-center py-8 text-gray-300 text-xs">暂无发布记录</div>
        ) : published.slice(-5).reverse().map((c: any) => (
          <div key={c.id} className="bg-white rounded-[10px] p-3.5 shadow-sm mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{c.platform === "wechat" ? "📰" : c.platform === "xiaohongshu" ? "📕" : c.platform === "douyin" ? "🎬" : "🎙️"}</span>
              <span className="text-[11px] font-medium truncate">{c.title}</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-gray-400">
              <span>👁️ {c.stats_views || 0}</span>
              <span>❤️ {c.stats_likes || 0}</span>
              <span>🔄 {c.stats_shares || 0}</span>
              <span className="ml-auto">{c.published_at ? c.published_at.slice(5,16) : ""}</span>
            </div>
          </div>
        ))}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
