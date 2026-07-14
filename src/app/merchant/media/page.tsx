"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";
import { C } from "@/lib/brand-colors";

const PLATFORMS: Record<string,{icon:string;label:string;color:string}> = {
  wechat: { icon: "📰", label: "公众号", color: C.green },
  xiaohongshu: { icon: "📕", label: "小红书", color: C.coral },
  douyin: { icon: "🎬", label: "抖音", color: C.purple },
  digital_human: { icon: "🎙️", label: "数字人", color: C.gold },
};
const STATUS_MAP: Record<string,{label:string;color:string}> = {
  draft: { label: "草稿", color: "#999" },
  pending: { label: "待审核", color: C.gold },
  approved: { label: "已通过", color: C.green },
  rejected: { label: "已驳回", color: C.coral },
  scheduled: { label: "定时", color: C.teal },
  published: { label: "已发布", color: C.green },
};

export default function MediaPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [storeId, setStoreId] = useState(0);
  const [overview, setOverview] = useState({ pending: 0, total: 0, today: 0, published: 0 });
  const [contents, setContents] = useState<any[]>([]);
  const [tab, setTab] = useState("pending");
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [genProgress, setGenProgress] = useState<{current:number; total:number; label:string} | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          const id = d.data.stores[0].id;
          setStoreId(id);
          loadData(id);
        }
      })
      .catch(() => {});
  }, [user]);

  // 自动轮询（待审核tab时每15秒刷新）
  useEffect(() => {
    if (!storeId || tab !== "pending") return;
    const timer = setInterval(() => loadData(storeId), 15000);
    return () => clearInterval(timer);
  }, [storeId, tab]);

  const loadData = (sid: number) => {
    fetch(`${API_BASE}/api/store-media?action=overview&store_id=${sid}`)
      .then(r => r.json()).then(d => { if (d.code === 0) setOverview(d.data); }).catch(() => {});
    const kw = searchKeyword ? `&keyword=${encodeURIComponent(searchKeyword)}` : "";
    const pf = filterPlatform ? `&platform=${filterPlatform}` : "";
    fetch(`${API_BASE}/api/store-media?action=contents&store_id=${sid}&status=${tab}${kw}${pf}`)
      .then(r => r.json()).then(d => { if (d.code === 0) setContents(d.data.list || []); }).catch(() => {});
  };

  const generate = async () => {
    setGenerating(true);
    const platforms = ["wechat", "xiaohongshu", "douyin", "digital_human"];
    const labels: Record<string,string> = { wechat: "公众号", xiaohongshu: "小红书", douyin: "抖音", digital_human: "数字人" };
    let totalCount = 0;
    setGenProgress({ current: 0, total: platforms.length, label: "准备中..." });
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      setGenProgress({ current: i, total: platforms.length, label: `正在生成 ${labels[p]} 内容...` });
      await new Promise(r => setTimeout(r, 300));
      try {
        const r = await fetch(`${API_BASE}/api/store-media?action=generate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId, platform: p }),
        });
        const d = await r.json();
        if (d.code === 0) totalCount += d.count || 0;
      } catch {}
    }
    setGenProgress(null);
    if (totalCount > 0) setMsg(`✅ 已生成 ${totalCount} 条内容`);
    else setMsg("❌ 生成失败");
    loadData(storeId);
    setGenerating(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const review = async (id: number, status: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg(`✅ ${d.msg}`);
      loadData(storeId);
    } catch { setMsg("❌ 操作失败"); }
    setTimeout(() => setMsg(""), 2000);
  };

  const publishContent = async (id: number) => {
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=publish`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg(`✅ ${d.msg}`);
      loadData(storeId);
    } catch { setMsg("❌ 发布失败"); }
    setTimeout(() => setMsg(""), 2000);
  };

  // ─── 批量操作 ───
  const batchReview = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=batch_review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg(`✅ ${d.msg}`);
      setSelectedIds([]); setBatchMode(false);
      loadData(storeId);
    } catch { setMsg("❌ 操作失败"); }
    setTimeout(() => setMsg(""), 2000);
  };

  const batchPublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=batch_publish`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg(`✅ ${d.msg}`);
      setSelectedIds([]); setBatchMode(false);
      loadData(storeId);
    } catch { setMsg("❌ 发布失败"); }
    setTimeout(() => setMsg(""), 2000);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>自媒体运营</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">AI生成 · 审核 · 发布</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
        <div className="bg-white rounded-[10px] p-2.5 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.teal}}>{overview.total}</div>
          <div className="text-[9px] text-gray-400">全部</div>
        </div>
        <div className="bg-white rounded-[10px] p-2.5 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.gold}}>{overview.pending}</div>
          <div className="text-[9px] text-gray-400">待审核</div>
        </div>
        <div className="bg-white rounded-[10px] p-2.5 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.green}}>{overview.published}</div>
          <div className="text-[9px] text-gray-400">已发布</div>
        </div>
        <div className="bg-white rounded-[10px] p-2.5 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.coral}}>{overview.today}</div>
          <div className="text-[9px] text-gray-400">今日</div>
        </div>
      </div>

      {/* 操作区 */}
      <div className="mx-4 mt-3 flex gap-2">
        <button onClick={generate} disabled={generating}
          className="flex-1 py-2.5 rounded-[10px] text-[11px] font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
          style={{background: C.teal}}>
          {generating ? "⏳ 生成中..." : "🤖 AI一键生成"}
        </button>
        <a href="/merchant/media/analytics"
          className="py-2.5 px-3 rounded-[10px] text-[11px] font-medium active:scale-[0.97] transition-transform flex items-center gap-1"
          style={{backgroundColor: `${C.purple}12`, color: C.purple}}>
          📊 看板
        </a>
        <a href="/merchant/media/schedules"
          className="py-2.5 px-3 rounded-[10px] text-[11px] font-medium active:scale-[0.97] transition-transform flex items-center gap-1"
          style={{backgroundColor: `${C.gold}12`, color: C.gold}}>
          ⏰ 定时
        </a>
        <button onClick={() => { setBatchMode(!batchMode); setSelectedIds([]); }}
          className="py-2.5 px-3 rounded-[10px] text-[11px] font-medium active:scale-[0.97] transition-transform"
          style={{backgroundColor: batchMode ? `${C.coral}15` : `${C.purple}10`, color: batchMode ? C.coral : C.purple}}>
          {batchMode ? "取消批量" : "☑️ 批量"}
        </button>
      </div>

      {/* Tab切换 */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-1 shadow-sm flex">
          {[
            { key: "pending", label: `待审核 ${overview.pending > 0 ? `(${overview.pending})` : ""}` },
            { key: "approved", label: "已通过" },
            { key: "published", label: "已发布" },
            { key: "", label: "全部" },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); fetch(`${API_BASE}/api/store-media?action=contents&store_id=${storeId}&status=${t.key}`).then(r=>r.json()).then(d=>{if(d.code===0) setContents(d.data.list||[]);}); }}
              className="flex-1 py-1.5 text-[10px] font-medium rounded-[8px] transition-all truncate"
              style={{
                backgroundColor: tab === t.key ? C.teal : "transparent",
                color: tab === t.key ? "#fff" : "#666",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索+平台筛选 */}
      {tab === "pending" && (
        <div className="mx-4 mt-1 flex items-center gap-1.5 justify-end">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
          <span className="text-[8px] text-gray-300">自动刷新中</span>
        </div>
      )}
      <div className="mx-4 mt-1 flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">🔍</span>
          <input value={searchKeyword} onChange={e => { setSearchKeyword(e.target.value); }} onKeyDown={e => { if (e.key === "Enter") loadData(storeId); }}
            placeholder="搜索标题..." className="w-full pl-7 pr-2 py-2 rounded-[8px] border border-gray-200 text-[11px] bg-white outline-none focus:border-brand-teal" />
        </div>
        <button onClick={() => { setFilterPlatform(""); loadData(storeId); }}
          className="text-[9px] px-2 py-1.5 rounded-full whitespace-nowrap active:scale-90 shrink-0"
          style={{backgroundColor: filterPlatform === "" ? C.teal : "#eee", color: filterPlatform === "" ? "#fff" : "#888"}}>全部</button>
        {Object.entries(PLATFORMS).map(([k, v]) => (
          <button key={k} onClick={() => { setFilterPlatform(k); loadData(storeId); }}
            className="text-[9px] px-2 py-1.5 rounded-full whitespace-nowrap active:scale-90 shrink-0"
            style={{backgroundColor: filterPlatform === k ? v.color : "#eee", color: filterPlatform === k ? "#fff" : "#888"}}>{v.label}</button>
        ))}
      </div>

      {/* 生成进度 */}
      {genProgress && (
        <div className="mx-4 mt-3 bg-white rounded-[12px] p-4 shadow-sm border border-brand-teal/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm animate-spin">⏳</span>
            <span className="text-[11px] font-medium">{genProgress.label}</span>
            <span className="text-[9px] text-gray-400 ml-auto">{genProgress.current}/{genProgress.total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{width:`${(genProgress.current/genProgress.total)*100}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.coral})`}} />
          </div>
        </div>
      )}

      {/* 内容列表 + 批量操作栏 */}
      {batchMode && selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-[12px] shadow-lg border border-gray-100 p-3 flex items-center gap-2 animate-slide-up">
          <span className="text-[10px] text-gray-500 shrink-0">已选 {selectedIds.length} 条</span>
          <button onClick={() => batchReview("approved")} className="flex-1 py-2 rounded-[8px] text-[10px] text-white font-medium active:scale-90" style={{background: C.green}}>✅ 通过</button>
          <button onClick={() => batchReview("rejected")} className="flex-1 py-2 rounded-[8px] text-[10px] text-white font-medium active:scale-90" style={{background: C.coral}}>❌ 驳回</button>
          <button onClick={batchPublish} className="flex-1 py-2 rounded-[8px] text-[10px] text-white font-medium active:scale-90" style={{background: C.teal}}>🚀 发布</button>
          <button onClick={() => { setSelectedIds([]); setBatchMode(false); }} className="text-[10px] text-gray-300 p-2">✕</button>
        </div>
      )}
      <div className="mx-4 mt-3 space-y-2">
        {contents.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-xs">
            {tab === "pending" ? "暂无待审核内容，点击「AI一键生成」创建" : "暂无内容"}
          </div>
        ) : contents.map((c: any) => {
          const p = PLATFORMS[c.platform] || { icon: "📄", label: c.platform, color: "#999" };
          const s = STATUS_MAP[c.status] || { label: c.status, color: "#999" };
          return (
            <div key={c.id} className="bg-white rounded-[10px] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{p.icon}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{background: p.color}}>{p.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{backgroundColor: `${s.color}15`, color: s.color}}>{s.label}</span>
              </div>
              <div className="text-[13px] font-medium truncate">{c.title}</div>
              <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{c.content}</div>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
                <span className="text-[9px] text-gray-300">
                  {c.scheduled_at ? `定时: ${c.scheduled_at.slice(5,16)}` : c.created_at ? `创建: ${new Date(c.created_at*1000).toLocaleString()}` : ""}
                </span>
                <div className="flex gap-1.5 items-center">
                  {batchMode && (
                    <div onClick={() => toggleSelect(c.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center active:scale-90 shrink-0 ${selectedIds.includes(c.id) ? "border-transparent" : "border-gray-300"}`}
                      style={selectedIds.includes(c.id) ? {background: C.teal} : {}}>
                      {selectedIds.includes(c.id) && <span className="text-white text-[8px]">✓</span>}
                    </div>
                  )}
                  <button onClick={() => { setPreview(c); setEditTitle(c.title); setEditContent(c.content); }} className="text-[9px] px-2 py-0.5 rounded-full active:scale-90 border" style={{borderColor: C.teal, color: C.teal}}>预览</button>
                  {c.status === "pending" && (
                    <>
                      <button onClick={() => review(c.id, "approved")} className="text-[9px] px-2 py-0.5 rounded-full text-white active:scale-90" style={{background: C.green}}>通过</button>
                      <button onClick={() => review(c.id, "rejected")} className="text-[9px] px-2 py-0.5 rounded-full text-white active:scale-90" style={{background: C.coral}}>驳回</button>
                    </>
                  )}
                  {c.status === "approved" && (
                    <button onClick={() => publishContent(c.id)} className="text-[9px] px-2 py-0.5 rounded-full text-white active:scale-90" style={{background: C.teal}}>发布</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* 预览/编辑弹窗 */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-[400px] max-h-[80vh] overflow-y-auto mx-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white pt-4 px-5 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
              <span className="text-sm font-semibold">内容预览</span>
              <button onClick={() => setPreview(null)} className="text-lg leading-none text-gray-400">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 font-medium">标题</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-[13px] border border-gray-100 rounded-[8px] outline-none focus:border-brand-teal" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium">内容</label>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8}
                  className="w-full mt-1 px-3 py-2 text-[11px] border border-gray-100 rounded-[8px] outline-none focus:border-brand-teal resize-none leading-relaxed" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-5 pb-4 pt-3 border-t border-gray-100 flex gap-2">
              <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-[10px] text-[11px] font-medium bg-gray-50 text-gray-500 active:scale-[0.97]">关闭</button>
              <button onClick={async () => {
                try {
                  await fetch(`${API_BASE}/api/store-media?action=edit`, {
                    method: "POST", headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({id: preview.id, title: editTitle, content: editContent}),
                  });
                  setMsg("✅ 已保存编辑");
                  setPreview(null);
                  loadData(storeId);
                } catch { setMsg("❌ 保存失败"); }
                setTimeout(() => setMsg(""), 2000);
              }} className="flex-1 py-2.5 rounded-[10px] text-[11px] font-bold text-white active:scale-[0.97]" style={{background: C.teal}}>💾 保存编辑</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
