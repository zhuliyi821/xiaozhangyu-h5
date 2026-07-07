"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PKTopic, PKFormData, APIResponse, DEFAULT_PK_FORM, PKMode, CharityMode, PoolMode, POOL_MODE_SCOPES, POOL_MODE_LABELS, POOL_MODE_DESCS, PK_MODE_LABELS, PK_MODE_DESCS, CHARITY_LABELS, CHARITY_PROJECTS, TIME_OPTIONS, CATEGORY_OPTIONS } from "./types";
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
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [activeMode, setActiveMode] = useState("");
  const [activeSort, setActiveSort] = useState("hot");
  const [bindMsg, setBindMsg] = useState("");
  const [showBind, setShowBind] = useState(false);

  // 发起PK
  const [showCreate, setShowCreate] = useState(false);
  const [pkForm, setPkForm] = useState<PKFormData>({ ...DEFAULT_PK_FORM });
  const [voteMsg, setVoteMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const uid = (user as any)?.uid || 0;

  const handleCreatePK = async () => {
    if (!uid) return;
    const validOptions = pkForm.options.filter(o => o.trim());
    if (!pkForm.title || validOptions.length < 2) return;
    const endTime = pkForm.end_time === "1h" ? Math.floor(Date.now()/1000) + 3600
      : pkForm.end_time === "3h" ? Math.floor(Date.now()/1000) + 10800
      : pkForm.end_time === "today" ? Math.floor(Date.now()/1000) + (24 - new Date().getHours()) * 3600
      : pkForm.end_time === "tomorrow" ? Math.floor(Date.now()/1000) + 86400
      : pkForm.end_time === "3d" ? Math.floor(Date.now()/1000) + 259200
      : pkForm.end_time === "7d" ? Math.floor(Date.now()/1000) + 604800
      : Math.floor(Date.now()/1000) + 2592000;
    try {
      const res = await fetch(`${API_BASE}/api/pk?action=create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: pkForm.title,
          options: validOptions,
          mode: pkForm.mode,
          category: pkForm.category,
          charity: pkForm.charity,
          charity_ratio: pkForm.charity_ratio,
          charity_project: pkForm.charity_project,
          pool_distribution: pkForm.pool_distribution,
          end_time: endTime,
          min_bet: parseInt(pkForm.min_bet) || 10,
          max_bet: parseInt(pkForm.max_bet) || 10000,
          challenger_limit: pkForm.challenger_limit,
          challenger_pool_limit: pkForm.challenger_pool_limit,
        }),
      });
      const j: APIResponse = await res.json();
      if (j.code === 0) {
        setShowCreate(false);
        setPkForm({ ...DEFAULT_PK_FORM });
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
      .catch(() => setError("网络不太给力"))
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
      <div style={{background:"linear-gradient(135deg,#45CCD5 0%,#2BAAAF 50%,#F2B631 100%)",borderRadius:"0 0 20px 20px",padding:"20px 16px 16px",color:"white",position:"relative",overflow:"hidden"}}>
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
        {/* ─── 错误提示 ─── */}
        {error && (
          <div style={{marginTop:8,padding:"10px 16px",background:"#FEF2F2",color:"#DC2626",fontSize:11,borderRadius:12,textAlign:"center"}}>
            {error}
            <span style={{marginLeft:8,textDecoration:"underline",cursor:"pointer"}} onClick={() => window.location.reload()}>重试</span>
          </div>
        )}

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
            <div style={{fontSize:11,fontWeight:600,color:"#2BAAAF",marginBottom:6}}>🔗 身份绑定</div>
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
                  background:"linear-gradient(135deg,#45CCD5,#2BAAAF)",color:"white",
                  fontSize:11,fontWeight:600,cursor:"pointer"}}>确认绑定</div>
            </div>
            {bindMsg && <div style={{fontSize:10,color:bindMsg.includes("✅") ? "#2BAAAF" : "#F27152",marginTop:4}}>{bindMsg}</div>}
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
                background: activeCat === cat.key ? "linear-gradient(135deg,#45CCD5,#2BAAAF)" : "transparent",
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
                background: activeMode === mode.key ? "linear-gradient(135deg,#45CCD5,#2BAAAF)" : "white",
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
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,
                    background: pk.category === "sports" ? "#E8FAFB" : pk.category === "social" ? "#FFF5E6" : pk.category === "event" ? "#FFF0ED" : "#F5E8F8",
                    color: pk.category === "sports" ? "#2BAAAF" : pk.category === "social" ? "#D97706" : pk.category === "event" ? "#F27152" : "#682575"}}>
                    {pk.category === "sports" ? "⚽" : pk.category === "social" ? "🌐" : pk.category === "event" ? "⚡" : "💬"} {pk.category === "sports" ? "体育" : pk.category === "social" ? "社会" : pk.category === "event" ? "突发" : "一言"}
                  </span>
                  {/* PK 形态标签 */}
                  <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,
                    background: pk.mode === "1v1" ? "#E8FAFB" : pk.mode === "1vN" ? "#FFF5E6" : "#F0E8FF",
                    color: pk.mode === "1v1" ? "#2BAAAF" : pk.mode === "1vN" ? "#D97706" : "#682575"}}>
                    {pk.mode === "1v1" ? "⚔️1v1" : pk.mode === "1vN" ? "🥊打擂" : "👥阵营"}
                  </span>
                  {/* 公益标签 */}
                  {pk.charity && pk.charity !== "none" && (
                    <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,
                      background:"#FFF0ED",color:"#F27152"}}>
                      ❤️公益
                    </span>
                  )}
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
                      <div style={{width:`${pk.total_votes > 0 ? Math.round((pk.vote_a ?? 0)/pk.total_votes*100) : 50}%`,background:"linear-gradient(90deg,#45CCD5,#2BAAAF)"}} />
                      <div style={{width:`${pk.total_votes > 0 ? Math.round((pk.vote_b ?? 0)/pk.total_votes*100) : 50}%`,background:"linear-gradient(90deg,#F27152,#E05A3D)"}} />
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#2BAAAF",fontWeight:500}}>{pk.option_a || pk.options?.[0] || "A"} {pk.total_votes > 0 ? Math.round((pk.vote_a ?? 0)/pk.total_votes*100) : 50}% · {(pk.pool_a ?? 0)}豆</span>
                      <span style={{color:"#F27152",fontWeight:500}}>{pk.option_b || pk.options?.[1] || "B"} {pk.total_votes > 0 ? Math.round((pk.vote_b ?? 0)/pk.total_votes*100) : 50}% · {(pk.pool_b ?? 0)}豆</span>
                    </div>
                  </div>

                {/* CTA 行 */}
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:4}}>
                  <div style={{flex:1,fontSize:10,color:"#9A9A9D"}}>起投 {pk.min_bet}豆</div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{padding:"6px 14px",borderRadius:10,border:"1px solid #E7E7E8",fontSize:12,color:"#2BAAAF",fontWeight:500}}>👀 围观</div>
                    <div style={{padding:"6px 18px",borderRadius:10,background:"linear-gradient(135deg,#45CCD5,#2BAAAF)",color:"white",fontSize:12,fontWeight:600,boxShadow:"0 2px 8px rgba(69,204,213,0.2)"}}>💰 下注</div>
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
          background:"linear-gradient(135deg,#45CCD5,#2BAAAF)",color:"white",
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

      {/* ─── 发起PK弹窗 — 完整设计方案 ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[400px] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">📝 发起事件</h3>
            <div className="space-y-3.5">

              {/* 1. PK 形态选择 */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">⚔️ PK形态</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["1v1", "1vN", "NvN"] as const).map(m => (
                    <button key={m} onClick={() => {
                      const poolKey = (Object.keys(POOL_MODE_SCOPES) as PoolMode[]).find(k => POOL_MODE_SCOPES[k].includes(m as any)) || "winner_takes_all";
                      setPkForm(f => ({ ...f, mode: m as PKMode, pool_distribution: poolKey }));
                    }}
                      className={`p-2 rounded-[10px] text-[10px] font-medium text-center transition-all ${
                        pkForm.mode === m
                          ? "bg-brand-teal-dark text-white shadow-sm"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}>
                      <div>{PK_MODE_LABELS[m].split(" ")[1]}</div>
                      <div className="text-[8px] opacity-80 mt-0.5">{PK_MODE_LABELS[m].split(" ")[0]}</div>
                    </button>
                  ))}
                </div>
                <div className="text-[8px] text-gray-400 mt-1">{PK_MODE_DESCS[pkForm.mode]}</div>
              </div>

              {/* 2. 话题 + 选项 */}
              <input type="text" placeholder="PK话题" value={pkForm.title}
                onChange={e => setPkForm({...pkForm, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-[12px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />

              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">选项（至少2个）</div>
                {pkForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-1.5">
                    <input type="text" placeholder={`选项${String.fromCharCode(65 + i)}`} value={opt}
                      onChange={e => {
                        const opts = [...pkForm.options];
                        opts[i] = e.target.value;
                        setPkForm({...pkForm, options: opts});
                      }}
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
                    {pkForm.options.length > 2 && (
                      <button onClick={() => setPkForm({...pkForm, options: pkForm.options.filter((_, j) => j !== i)})}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">✕</button>
                    )}
                  </div>
                ))}
                {pkForm.options.length < 6 && (
                  <button onClick={() => setPkForm({...pkForm, options: [...pkForm.options, ""]})}
                    className="text-[10px] text-brand-teal-dark font-medium mt-1">+ 添加选项</button>
                )}
              </div>

              {/* 3. 公益模式 */}
              <div className="border-t border-gray-100 pt-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 font-medium">❤️ 公益模式</span>
                  <button onClick={() => setPkForm(f => ({ ...f, charity: f.charity === "none" ? "all_donate" : "none" }))}
                    className={`text-[10px] px-3 py-1 rounded-[8px] font-medium transition-all ${
                      pkForm.charity !== "none"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-400"
                    }`}>
                    {pkForm.charity !== "none" ? "❤️ 已开启" : "关闭"}
                  </button>
                </div>
                {pkForm.charity !== "none" && (
                  <div className="bg-red-50/50 rounded-[12px] p-3 space-y-2">
                    <div className="flex gap-1.5">
                      {(["all_donate", "percentage"] as CharityMode[]).filter(c => c !== "none" && c !== "brand_match").map(c => (
                        <button key={c} onClick={() => setPkForm(f => ({ ...f, charity: c }))}
                          className={`flex-1 py-1.5 rounded-[8px] text-[9px] font-medium transition-all ${
                            pkForm.charity === c ? "bg-brand-coral text-white" : "bg-white text-gray-500"
                          }`}>
                          {CHARITY_LABELS[c].replace("❤️ ", "")}
                        </button>
                      ))}
                    </div>
                    {pkForm.charity === "percentage" && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400">抽成比例</span>
                        <input type="number" value={pkForm.charity_ratio}
                          onChange={e => setPkForm(f => ({ ...f, charity_ratio: parseInt(e.target.value) || 10 }))}
                          className="w-16 px-2 py-1 bg-white rounded-[6px] text-xs text-center outline-none" min={1} max={50} />
                        <span className="text-[9px] text-gray-400">%</span>
                      </div>
                    )}
                    <select value={pkForm.charity_project} onChange={e => setPkForm(f => ({ ...f, charity_project: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white rounded-[8px] text-[10px] outline-none text-gray-500">
                      <option value="">选择受益项目</option>
                      {CHARITY_PROJECTS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 4. 奖池分配 */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">💰 奖池分配</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(POOL_MODE_SCOPES) as PoolMode[])
                    .filter(k => POOL_MODE_SCOPES[k].includes(pkForm.mode))
                    .map(k => (
                    <button key={k} onClick={() => setPkForm(f => ({ ...f, pool_distribution: k }))}
                      className={`p-2 rounded-[10px] text-[10px] text-left transition-all ${
                        pkForm.pool_distribution === k
                          ? "bg-brand-teal/10 border border-brand-teal/30"
                          : "bg-gray-50 border border-transparent"
                      }`}>
                      <div className="font-medium">{POOL_MODE_LABELS[k]}</div>
                      <div className="text-[8px] text-gray-400 mt-0.5 leading-relaxed">{POOL_MODE_DESCS[k].slice(0, 30)}...</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. 品类 */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">📂 品类</div>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button key={opt.key} onClick={() => setPkForm(f => ({ ...f, category: opt.key }))}
                      className={`px-3 py-1.5 rounded-[8px] text-[10px] font-medium transition-all ${
                        pkForm.category === opt.key ? "bg-brand-teal-dark text-white" : "bg-gray-50 text-gray-500"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. 时间 */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5">⏱ 截止时间</div>
                <div className="flex gap-1.5 flex-wrap">
                  {TIME_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setPkForm(f => ({ ...f, end_time: opt.value }))}
                      className={`px-3 py-1.5 rounded-[8px] text-[10px] font-medium transition-all ${
                        pkForm.end_time === opt.value ? "bg-brand-teal-dark text-white" : "bg-gray-50 text-gray-500"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. 投注限制 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 mb-1">最低投注</div>
                  <div className="flex gap-1">
                    {[10, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setPkForm(f => ({ ...f, min_bet: amt.toString() }))}
                        className={`flex-1 py-1.5 rounded-[8px] text-[10px] font-medium transition-all ${
                          pkForm.min_bet === amt.toString() ? "bg-brand-teal-dark text-white" : "bg-gray-50 text-gray-500"
                        }`}>
                        {amt}豆
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 mb-1">最高投注</div>
                  <div className="flex gap-1">
                    {[1000, 5000, 10000].map(amt => (
                      <button key={amt} onClick={() => setPkForm(f => ({ ...f, max_bet: amt.toString() }))}
                        className={`flex-1 py-1.5 rounded-[8px] text-[10px] font-medium transition-all ${
                          pkForm.max_bet === amt.toString() ? "bg-brand-teal-dark text-white" : "bg-gray-50 text-gray-500"
                        }`}>
                        {amt >= 1000 ? `${(amt/1000).toFixed(0)}k` : amt}豆
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8. 1vN 擂台限制 */}
              {pkForm.mode === "1vN" && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-400 mb-1">挑战人数上限</div>
                    <input type="number" value={pkForm.challenger_limit}
                      onChange={e => setPkForm(f => ({ ...f, challenger_limit: parseInt(e.target.value) || 100 }))}
                      className="w-full px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-400 mb-1">总豆上限</div>
                    <input type="number" value={pkForm.challenger_pool_limit}
                      onChange={e => setPkForm(f => ({ ...f, challenger_pool_limit: parseInt(e.target.value) || 10000 }))}
                      className="w-full px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none" />
                  </div>
                </div>
              )}

              {/* 9. 1v1 @邀请 */}
              {pkForm.mode === "1v1" && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">@邀请好友（选填）</div>
                  <input type="text" placeholder="输入好友昵称或UID" value={pkForm.invite_user}
                    onChange={e => setPkForm(f => ({ ...f, invite_user: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 rounded-[10px] text-xs outline-none focus:ring-2 focus:ring-brand-teal/30" />
                </div>
              )}

              {/* 提交 */}
              <button onClick={handleCreatePK}
                disabled={!pkForm.title || pkForm.options.filter(o => o.trim()).length < 2}
                className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] text-xs font-semibold shadow-[0_4px_16px_rgba(69,204,213,0.3)] disabled:opacity-50 active:scale-[0.98] transition-transform">
                发布事件
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
