"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA", green: "#10B981" };
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

  const loadData = (sid: number) => {
    fetch(`${API_BASE}/api/store-media?action=overview&store_id=${sid}`)
      .then(r => r.json()).then(d => { if (d.code === 0) setOverview(d.data); }).catch(() => {});
    fetch(`${API_BASE}/api/store-media?action=contents&store_id=${sid}&status=${tab}`)
      .then(r => r.json()).then(d => { if (d.code === 0) setContents(d.data.list || []); }).catch(() => {});
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await fetch(`${API_BASE}/api/store-media?action=generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, platform: "all" }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg(`✅ ${d.msg}`);
      else setMsg("❌ 生成失败");
      loadData(storeId);
    } catch { setMsg("❌ 网络错误"); }
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

      {/* 内容列表 */}
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
                <div className="flex gap-1.5">
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
