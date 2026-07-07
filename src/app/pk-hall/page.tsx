"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PKTopic, PKFormData, APIResponse } from "./types";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

const CATEGORIES = [
  { key: "",      label: "全部" },
  { key: "sports", label: "⚽ 体育" },
  { key: "social", label: "🌐 社会" },
];

const MODES = [
  { key: "", label: "全部模式" },
  { key: "1v1", label: "1v1 单挑" },
];

const SORTS = [
  { key: "hot",   label: "🔥 热门" },
  { key: "local", label: "📍 本地" },
  { key: "follow",label: "👤 关注" },
];

// ETag cache
let lastETag = "";
let cachedData: PKTopic[] = [];

export default function PKHallPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [topics, setTopics] = useState<PKTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("");
  const [activeMode, setActiveMode] = useState("");
  const [activeSort, setActiveSort] = useState("hot");
  const [bindMsg, setBindMsg] = useState("");
  const [showBind, setShowBind] = useState(false);

  // 发起PK
  const [showCreate, setShowCreate] = useState(false);
  const [pkForm, setPkForm] = useState<PKFormData>({ title: "", option_a: "", option_b: "", end_time: "tomorrow", min_bet: "10" });
  const [createCat, setCreateCat] = useState("sports");
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const uid = (user as any)?.uid || 0;

  const handleCreatePK = async () => {
    if (!uid) return;
    if (!pkForm.title || !pkForm.option_a || !pkForm.option_b) return;
    const endTime = pkForm.end_time === "1h" ? Math.floor(Date.now()/1000) + 3600
      : pkForm.end_time === "3h" ? Math.floor(Date.now()/1000) + 10800
      : pkForm.end_time === "tomorrow" ? Math.floor(Date.now()/1000) + 86400
      : Math.floor(Date.now()/1000) + 604800;
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, title: pkForm.title, option_a: pkForm.option_a, option_b: pkForm.option_b, category: createCat, mode: "1v1", end_time: endTime, min_bet: parseInt(pkForm.min_bet) || 10 }),
      });
      const j: APIResponse = await res.json();
      if (j.code === 0) {
        setShowCreate(false);
        setPkForm({ title: "", option_a: "", option_b: "", end_time: "tomorrow", min_bet: "10" });
        setVoteMsg("✅ PK话题发起成功！");
      } else { setVoteMsg(`❌ ${j.msg}`); }
    } catch { setVoteMsg("❌ 创建失败"); }
    setTimeout(() => setVoteMsg(""), 2500);
  };

  useEffect(() => {
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    if (lastETag) headers["If-None-Match"] = lastETag;

    fetch(`${API_BASE}/api/pk?action=list`, { headers, signal: controller.signal })
      .then(async r => {
        const etag = r.headers.get("ETag") || "";
        if (etag) lastETag = etag;
        if (r.status === 304) { setTopics(cachedData); return; }
        const j: APIResponse<PKTopic[]> = await r.json();
        if (j.code === 0 && j.data) {
          cachedData = j.data;
          setTopics(j.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 筛选逻辑：只显示 sports/social 品类
  const ALLOWED_CATS = ["sports", "social"];
  let filtered = topics.filter(t => ALLOWED_CATS.includes(t.category));
  if (activeCat) filtered = filtered.filter(t => t.category === activeCat);
  if (activeMode) filtered = filtered.filter(t => t.mode === activeMode);
  if (activeSort === "hot") filtered = [...filtered].sort((a, b) => b.total_votes - a.total_votes);

  const stats = {
    active: topics.filter(t => t.status === 1).length,
    pool: topics.reduce((s, t) => s + t.total_pool, 0),
    voters: topics.reduce((s, t) => s + t.total_votes, 0),
  };

  return (
    <div style={{width:"100%",maxWidth:420,margin:"0 auto",background:"#FFFFFF",minHeight:"100vh",position:"relative",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

      {/* ─── Header ─── */}
      <div style={{background:"linear-gradient(135deg,#45CCD5 0%,#2AA8B0 50%,#F2B631 100%)",borderRadius:"0 0 20px 20px",padding:"20px 16px 16px",color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.25) 0%,transparent 70%)"}} />
        <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:20,fontWeight:700}}>PK 大厅</div>
            <div style={{fontSize:12,opacity:0.85,marginTop:2}}>选择方向，发起PK对战</div>
          </div>
          <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚔</div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,background:"rgba(255,255,255,0.12)",borderRadius:12,padding:"10px 8px",position:"relative",zIndex:1}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700}}>{stats.active}</div>
            <div style={{fontSize:9,opacity:0.75}}>进行中</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,0.2)"}} />
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700}}>{stats.pool > 999 ? (stats.pool/1000).toFixed(1)+"k" : stats.pool}</div>
            <div style={{fontSize:9,opacity:0.75}}>总奖池 💰</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,0.2)"}} />
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700}}>{stats.voters}</div>
            <div style={{fontSize:9,opacity:0.75}}>总参与</div>
          </div>
        </div>
      </div>

      <div style={{padding:"0 12px"}}>
        {/* ─── 身份绑定入口 ─── */}
        {user && !showBind && (
          <div onClick={() => setShowBind(true)}
            style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,marginBottom:0,
              padding:"4px 10px",borderRadius:999,fontSize:10,color:"#6B6B6E",
              border:"1px solid #E7E7E8",cursor:"pointer",background:"white"}}>
            🔗 绑定账号
          </div>
        )}
        {showBind && (
          <div style={{background:"white",borderRadius:12,padding:12,marginTop:8,marginBottom:8,
            border:"1px solid #45CCD5",boxShadow:"0 2px 12px rgba(69,204,213,0.15)",position:"relative"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#2AA8B0",marginBottom:6}}>🔗 身份绑定</div>
            <div style={{fontSize:10,color:"#6B6B6E",marginBottom:8}}>
              绑定后可在企微接收结算通知、到店核销奖励
            </div>
            <div style={{display:"flex",gap:6}}>
              <input id="bindSource" placeholder="来源 (h5/wecom)"
                style={{flex:1,padding:"6px 8px",borderRadius:8,border:"1px solid #E7E7E8",
                  fontSize:11,outline:"none"}} />
              <input id="bindExtId" placeholder="外部ID"
                style={{flex:1,padding:"6px 8px",borderRadius:8,border:"1px solid #E7E7E8",
                  fontSize:11,outline:"none"}} />
            </div>
            <div style={{display:"flex",gap:6,marginTop:6,justifyContent:"flex-end"}}>
              <div onClick={() => { setShowBind(false); setBindMsg(""); }}
                style={{padding:"6px 12px",borderRadius:8,border:"1px solid #E7E7E8",
                  fontSize:11,color:"#6B6B6E",cursor:"pointer"}}>取消</div>
              <div onClick={async () => {
                  const src = (document.getElementById("bindSource") as HTMLInputElement)?.value || "h5";
                  const extId = (document.getElementById("bindExtId") as HTMLInputElement)?.value || `user_${(user as any)?.uid || 0}`;
                  try {
                    const r = await fetch(`${API_BASE}/api/pk?action=bind_identity`, {
                      method:"POST",headers:{"Content-Type":"application/json"},
                      body:JSON.stringify({uid:(user as any)?.uid || 0, source:src, external_id:extId})
                    });
                    const j = await r.json();
                    setBindMsg(j.code === 0 ? "✅ 绑定成功" : `❌ ${j.msg || "绑定失败"}`);
                    if (j.code === 0) setTimeout(() => setShowBind(false), 1500);
                  } catch { setBindMsg("❌ 网络错误"); }
                }}
                style={{padding:"6px 16px",borderRadius:8,
                  background:"linear-gradient(135deg,#45CCD5,#2AA8B0)",color:"white",
                  fontSize:11,fontWeight:600,cursor:"pointer"}}>确认绑定</div>
            </div>
            {bindMsg && <div style={{fontSize:10,color:bindMsg.includes("✅") ? "#2AA8B0" : "#F27152",marginTop:4}}>{bindMsg}</div>}
          </div>
        )}

        {/* ─── 品类 Tabs ─── */}
        <div style={{display:"flex",gap:4,padding:4,marginTop:12,background:"white",borderRadius:999,boxShadow:"0 2px 8px rgba(69,204,213,0.08)",overflow:"hidden"}}>
          {CATEGORIES.map(cat => (
            <div key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              style={{
                flex:1,padding:"8px 0",textAlign:"center",fontSize:12,fontWeight: activeCat === cat.key ? 600 : 500,
                borderRadius:999,cursor:"pointer",
                background: activeCat === cat.key ? "linear-gradient(135deg,#45CCD5,#2AA8B0)" : "transparent",
                color: activeCat === cat.key ? "white" : "#9A9A9D",
                boxShadow: activeCat === cat.key ? "0 2px 6px rgba(69,204,213,0.2)" : "none",
                transition:"all 0.2s",
              }}>
              {cat.label}
            </div>
          ))}
        </div>

        {/* ─── 模式筛选 ─── */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
          {MODES.map(mode => (
            <span key={mode.key} onClick={() => setActiveMode(mode.key)}
              style={{
                padding:"4px 12px",borderRadius:999,fontSize:11,fontWeight:500,cursor:"pointer",
                background: activeMode === mode.key ? "linear-gradient(135deg,#45CCD5,#2AA8B0)" : "white",
                color: activeMode === mode.key ? "white" : "#6B6B6E",
                border: activeMode === mode.key ? "none" : "1px solid #E7E7E8",
                transition:"all 0.2s",
              }}>
              {mode.label}
            </span>
          ))}
        </div>

        {/* ─── 排序筛选 ─── */}
        <div style={{display:"flex",gap:6,marginTop:8,marginBottom:12}}>
          {SORTS.map(s => (
            <span key={s.key} onClick={() => setActiveSort(s.key)}
              style={{
                padding:"4px 12px",borderRadius:999,fontSize:11,fontWeight:500,cursor:"pointer",
                background: activeSort === s.key ? "#FFF5E6" : "white",
                color: activeSort === s.key ? "#D97706" : "#6B6B6E",
                border: activeSort === s.key ? "none" : "1px solid #E7E7E8",
                transition:"all 0.2s",
              }}>
              {s.label}
            </span>
          ))}
        </div>

        {/* ─── 实时动态条 ─── */}
        {topics.length > 0 && (
          <div style={{background:"white",borderRadius:10,padding:"8px 12px",marginBottom:12,border:"1px solid #E7E7E8",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#45CCD5",animation:"pkPulse 1.5s infinite"}} />
            <div style={{fontSize:11,color:"#6B6B6E",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
              <span style={{fontWeight:500,color:"#45CCD5"}}>{topics[0]?.creator_name || "用户"}</span> 刚刚投了{" "}
              <span style={{fontWeight:500,color:"#F27152"}}>{topics[0]?.option_a} {topics[0]?.min_bet}豆</span>
            </div>
          </div>
        )}

        {/* ─── 房间列表 ─── */}
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[1,2,3].map(i => (
              <div key={i} style={{background:"white",borderRadius:16,padding:16,boxShadow:"0 2px 8px rgba(69,204,213,0.05)",border:"1px solid #E7E7E8",animation:"pulse 1.5s infinite"}}>
                <div style={{height:14,width:"60%",background:"#E7E7E8",borderRadius:4,marginBottom:12}} />
                <div style={{height:10,width:"100%",background:"#E7E7E8",borderRadius:4,marginBottom:8}} />
                <div style={{height:8,width:"100%",background:"#E7E7E8",borderRadius:4}} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px 0",color:"#9A9A9D",fontSize:12}}>
            <div style={{fontSize:40,marginBottom:8}}>🏟</div>
            当前还没有PK话题
            <div style={{marginTop:8}}>成为第一个发起PK的人</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map(pk => (
              <div key={pk.id} onClick={() => router.push(`/pk-hall/${pk.category}/${pk.id}`)}
                style={{background:"white",borderRadius:16,padding:16,cursor:"pointer",
                  boxShadow:"0 2px 8px rgba(69,204,213,0.05)",border:"1px solid #E7E7E8",
                  transition:"all 0.15s"}}>

                {/* 顶栏标签 */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,
                    background: pk.category === "sports" ? "#E8FAFB" : pk.category === "social" ? "#FFF5E6" : pk.category === "event" ? "#FFF0ED" : "#F5E8F8",
                    color: pk.category === "sports" ? "#2AA8B0" : pk.category === "social" ? "#D97706" : pk.category === "event" ? "#F27152" : "#682575"}}>
                    {pk.category === "sports" ? "⚽" : pk.category === "social" ? "🌐" : pk.category === "event" ? "⚡" : "💬"} {pk.category === "sports" ? "体育" : pk.category === "social" ? "社会" : pk.category === "event" ? "突发" : "一言"}
                  </span>
                  <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,background:"#FFF0ED",color:"#F27152"}}>
                    1v1 ⚔
                  </span>
                  <span style={{marginLeft:"auto",fontSize:10,color: pk.time_remaining < 1800 ? "#F27152" : "#6B6B6E"}}>
                    ⏰ {pk.time_label}
                  </span>
                </div>

                {/* 标题 */}
                <div style={{fontSize:14,fontWeight:600,color:"#1C1C1D",marginBottom:6}}>
                  {pk.title}
                </div>
                <div style={{fontSize:11,color:"#9A9A9D",marginBottom:8}}>
                  💰 奖池 {pk.total_pool}豆 · 👥 {pk.total_votes}人参与
                </div>

                {/* 双进度条 - 始终1v1 */}
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",height:8,borderRadius:999,overflow:"hidden",marginBottom:6}}>
                      <div style={{width:`${pk.total_votes > 0 ? Math.round(pk.vote_a/pk.total_votes*100) : 50}%`,background:"linear-gradient(90deg,#45CCD5,#2AA8B0)"}} />
                      <div style={{width:`${pk.total_votes > 0 ? Math.round(pk.vote_b/pk.total_votes*100) : 50}%`,background:"linear-gradient(90deg,#F27152,#E05A3D)"}} />
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#2AA8B0",fontWeight:500}}>{pk.option_a} {pk.total_votes > 0 ? Math.round(pk.vote_a/pk.total_votes*100) : 50}% · {pk.pool_a}豆</span>
                      <span style={{color:"#F27152",fontWeight:500}}>{pk.option_b} {pk.total_votes > 0 ? Math.round(pk.vote_b/pk.total_votes*100) : 50}% · {pk.pool_b}豆</span>
                    </div>
                  </div>

                {/* CTA 行 */}
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:4}}>
                  <div style={{flex:1,fontSize:10,color:"#9A9A9D"}}>起投 {pk.min_bet}豆</div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{padding:"6px 14px",borderRadius:10,border:"1px solid #E7E7E8",fontSize:12,color:"#2AA8B0",fontWeight:500}}>👀 围观</div>
                    <div style={{padding:"6px 18px",borderRadius:10,background:"linear-gradient(135deg,#45CCD5,#2AA8B0)",color:"white",fontSize:12,fontWeight:600,boxShadow:"0 2px 8px rgba(69,204,213,0.2)"}}>💰 下注</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── FAB按钮 ─── */}
      <div onClick={() => { if (!uid) { setShowLogin(true); return; } setShowCreate(true); }}
        style={{position:"fixed",bottom:80,right:16,width:56,height:56,borderRadius:"50%",
          background:"linear-gradient(135deg,#45CCD5,#2AA8B0)",color:"white",
          display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
          fontSize:20,fontWeight:300,boxShadow:"0 4px 16px rgba(69,204,213,0.35)",cursor:"pointer",
          zIndex:100,lineHeight:1}}>
        <span style={{marginTop:-2}}>+</span>
        <span style={{fontSize:9}}>PK</span>
      </div>

      <style>{`
        @keyframes pkPulse { 0%,100% { opacity:1;transform:scale(1) }
50%{opacity:.6;transform:scale(.8)} }
        @keyframes pulse { 0%,100% { opacity:1 } 50%{ opacity:.5 } }
      `}</style>

      {/* ─── 发起PK弹窗 ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">💰 发起PK</h3>
            <div className="space-y-3">
              <input type="text" placeholder="PK话题" value={pkForm.title} onChange={e => setPkForm({...pkForm, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-teal-500/30" />
              <div className="flex gap-2">
                <input type="text" placeholder="选项A" value={pkForm.option_a} onChange={e => setPkForm({...pkForm, option_a: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-teal-500/30" />
                <span className="self-center text-xs text-gray-400">VS</span>
                <input type="text" placeholder="选项B" value={pkForm.option_b} onChange={e => setPkForm({...pkForm, option_b: e.target.value})}
                  className="flex-1 px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">📂 品类</div>
                <div className="flex gap-2">
                  {[{label:"⚽ 体育",v:"sports"},{label:"🌐 社会",v:"social"}].map(opt => (
                    <button key={opt.v} onClick={() => setCreateCat(opt.v)}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${createCat === opt.v ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">⏱ 截止时间</div>
                <div className="flex gap-2">
                  {[{label:"1小时",v:"1h"},{label:"3小时",v:"3h"},{label:"明天",v:"tomorrow"},{label:"7天",v:"7d"}].map(opt => (
                    <button key={opt.v} onClick={() => setPkForm({...pkForm, end_time: opt.v})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.end_time === opt.v ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">💰 最低投注</div>
                <div className="flex gap-2">
                  {[10,50,100].map(amt => (
                    <button key={amt} onClick={() => setPkForm({...pkForm, min_bet: amt.toString()})}
                      className={`flex-1 py-2 rounded-[10px] text-[11px] font-medium transition-all ${pkForm.min_bet === amt.toString() ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                      {amt}豆
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreatePK} disabled={!pkForm.title || !pkForm.option_a || !pkForm.option_b}
                className="w-full py-2.5 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-[12px] text-xs font-medium disabled:opacity-50">
                发起PK
              </button>
            </div>
          </div>
        </div>
      )}

      {voteMsg && (
        <div className="fixed bottom-28 left-4 right-4 px-4 py-2 text-center text-[11px] font-medium bg-green-50 text-green-700 rounded-[12px] z-50 shadow-lg">
          {voteMsg}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
