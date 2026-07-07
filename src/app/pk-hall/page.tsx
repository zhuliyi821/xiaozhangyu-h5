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
    <div className="w-full max-w-[420px] mx-auto bg-white min-h-screen relative">

      {/* ─── Header ─── */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-gold rounded-b-[20px] px-4 pt-5 pb-4 text-white relative overflow-hidden">
        <div className="absolute -top-7 -right-7 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.25)_0%,transparent_70%)]" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="text-xl font-bold">PK 大厅</div>
            <div className="text-xs opacity-85 mt-0.5">选择方向，发起PK对战</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">⚔</div>
        </div>
        <div className="flex gap-2 mt-3.5 bg-white/12 backdrop-blur-sm rounded-[12px] p-2 relative z-10">
          <div className="flex-1 text-center">
            <div className="text-base font-bold">{stats.active}</div>
            <div className="text-[9px] opacity-75">进行中</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-center">
            <div className="text-base font-bold">{stats.pool > 999 ? (stats.pool/1000).toFixed(1)+"k" : stats.pool}</div>
            <div className="text-[9px] opacity-75">总奖池 💰</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-center">
            <div className="text-base font-bold">{stats.voters}</div>
            <div className="text-[9px] opacity-75">总参与</div>
          </div>
        </div>
      </div>

      <div className="px-3">
        {/* ─── 错误提示 ─── */}
        {error && (
          <div className="mt-2 px-4 py-2.5 bg-red-50 text-red-600 text-[11px] rounded-[12px] text-center">
            {error}
            <span className="ml-2 underline cursor-pointer" onClick={() => window.location.reload()}>重试</span>
          </div>
        )}

        {/* ─── 身份绑定入口 ─── */}
        {user && !showBind && (
          <div onClick={() => setShowBind(true)}
            className="inline-flex items-center gap-1 mt-2 mb-0 px-2.5 py-1 rounded-full text-[10px] text-[#6B6B6E] border border-[#E7E7E8] cursor-pointer bg-white">
            🔗 绑定账号
          </div>
        )}
        {showBind && (
          <div className="bg-white rounded-[12px] p-3 mt-2 mb-2 border border-brand-teal shadow-[0_2px_12px_rgba(69,204,213,0.15)] relative">
            <div className="text-[11px] font-semibold text-brand-teal-dark mb-1.5">🔗 身份绑定</div>
            <div className="text-[10px] text-[#6B6B6E] mb-2">绑定后可在企微接收结算通知、到店核销奖励</div>
            <div className="flex gap-1.5">
              <input id="bindSource" placeholder="来源 (h5/wecom)"
                className="flex-1 px-2 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] outline-none" />
              <input id="bindExtId" placeholder="外部ID"
                className="flex-1 px-2 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] outline-none" />
            </div>
            <div className="flex gap-1.5 mt-1.5 justify-end">
              <div onClick={() => { setShowBind(false); setBindMsg(""); }}
                className="px-3 py-1.5 rounded-[8px] border border-[#E7E7E8] text-[11px] text-[#6B6B6E] cursor-pointer">取消</div>
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
                className="px-4 py-1.5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[11px] font-semibold cursor-pointer">确认绑定</div>
            </div>
            {bindMsg && <div className={`text-[10px] mt-1 ${bindMsg.includes("✅") ? 'text-brand-teal-dark' : 'text-brand-coral'}`}>{bindMsg}</div>}
          </div>
        )}

        {/* ─── 品类 Tabs ─── */}
        <div className="flex gap-1 p-1 mt-3 bg-white rounded-full shadow-[0_2px_8px_rgba(69,204,213,0.08)] overflow-hidden">
          {CATEGORIES.map(cat => (
            <div key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={`flex-1 py-2 text-center text-xs font-medium rounded-full cursor-pointer transition-all ${
                activeCat === cat.key
                  ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-[0_2px_6px_rgba(69,204,213,0.2)]"
                  : "text-[#9A9A9D] hover:text-gray-600"
              }`}>
              {cat.label}
            </div>
          ))}
        </div>

        {/* ─── 模式筛选 ─── */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {MODES.map(mode => (
            <span key={mode.key} onClick={() => setActiveMode(mode.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
                activeMode === mode.key
                  ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white"
                  : "bg-white text-[#6B6B6E] border border-[#E7E7E8]"
              }`}>
              {mode.label}
            </span>
          ))}
        </div>

        {/* ─── 排序筛选 ─── */}
        <div className="flex gap-1.5 mt-2 mb-3">
          {SORTS.map(s => (
            <span key={s.key} onClick={() => setActiveSort(s.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
                activeSort === s.key
                  ? "bg-[#FFF5E6] text-[#D97706]"
                  : "bg-white text-[#6B6B6E] border border-[#E7E7E8]"
              }`}>
              {s.label}
            </span>
          ))}
        </div>

        {/* ─── 实时动态条 ─── */}
        {topics.length > 0 && (
          <div className="bg-white rounded-[10px] px-3 py-2 mb-3 border border-[#E7E7E8] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-ping" />
            <div className="text-[11px] text-[#6B6B6E] truncate">
              <span className="font-medium text-brand-teal">{topics[0]?.creator_name || "用户"}</span> 刚刚投了{" "}
              <span className="font-medium text-brand-coral">{topics[0]?.option_a} {topics[0]?.min_bet}豆</span>
            </div>
          </div>
        )}

        {/* ─── 房间列表 ─── */}
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-[16px] p-4 shadow-[0_2px_8px_rgba(69,204,213,0.05)] border border-[#E7E7E8] animate-pulse">
                <div className="h-3.5 w-3/5 bg-[#E7E7E8] rounded mb-3" />
                <div className="h-2.5 w-full bg-[#E7E7E8] rounded mb-2" />
                <div className="h-2 w-full bg-[#E7E7E8] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[#9A9A9D] text-xs">
            <div className="text-[40px] mb-2">🏟</div>
            当前还没有PK话题
            <div className="mt-2">成为第一个发起PK的人</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(pk => (
              <div key={pk.id} onClick={() => router.push(`/pk-hall/${pk.category}/${pk.id}`)}
                className="bg-white rounded-[16px] p-4 cursor-pointer shadow-[0_2px_8px_rgba(69,204,213,0.05)] border border-[#E7E7E8] transition-all active:scale-[0.98]">

                {/* 顶栏标签 */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${
                    pk.category === "sports" ? "bg-[#E8FAFB] text-brand-teal-dark"
                    : pk.category === "social" ? "bg-[#FFF5E6] text-[#D97706]"
                    : pk.category === "event" ? "bg-[#FFF0ED] text-brand-coral"
                    : "bg-[#F5E8F8] text-[#682575]"
                  }`}>
                    {pk.category === "sports" ? "⚽" : pk.category === "social" ? "🌐" : pk.category === "event" ? "⚡" : "💬"} {pk.category === "sports" ? "体育" : pk.category === "social" ? "社会" : pk.category === "event" ? "突发" : "一言"}
                  </span>
                  {/* PK 形态标签 */}
                  <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${
                    pk.mode === "1v1" ? "bg-[#E8FAFB] text-brand-teal-dark"
                    : pk.mode === "1vN" ? "bg-[#FFF5E6] text-[#D97706]"
                    : "bg-[#F0E8FF] text-[#682575]"
                  }`}>
                    {pk.mode === "1v1" ? "⚔️1v1" : pk.mode === "1vN" ? "🥊打擂" : "👥阵营"}
                  </span>
                  {/* 公益标签 */}
                  {pk.charity && pk.charity !== "none" && (
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#FFF0ED] text-brand-coral">
                      ❤️公益
                    </span>
                  )}
                  <span className={`ml-auto text-[10px] ${pk.time_remaining < 1800 ? 'text-brand-coral' : 'text-[#6B6B6E]'}`}>
                    ⏰ {pk.time_label}
                  </span>
                </div>

                {/* 标题 */}
                <div className="text-sm font-semibold text-[#1C1C1D] mb-1.5">
                  {pk.title}
                </div>
                <div className="text-[11px] text-[#9A9A9D] mb-2">
                  💰 奖池 {pk.total_pool}豆 · 👥 {pk.total_votes}人参与
                </div>

                {/* 双进度条 */}
                <div className="mb-2.5">
                  <div className="flex h-2 rounded-full overflow-hidden mb-1.5">
                    <div style={{width:`${pk.total_votes > 0 ? Math.round((pk.vote_a ?? 0)/pk.total_votes*100) : 50}%`}} className="bg-gradient-to-r from-brand-teal to-brand-teal-dark" />
                    <div style={{width:`${pk.total_votes > 0 ? Math.round((pk.vote_b ?? 0)/pk.total_votes*100) : 50}%`}} className="bg-gradient-to-r from-brand-coral to-[#E05A3D]" />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-brand-teal-dark font-medium">{pk.option_a || pk.options?.[0] || "A"} {pk.total_votes > 0 ? Math.round((pk.vote_a ?? 0)/pk.total_votes*100) : 50}% · {(pk.pool_a ?? 0)}豆</span>
                    <span className="text-brand-coral font-medium">{pk.option_b || pk.options?.[1] || "B"} {pk.total_votes > 0 ? Math.round((pk.vote_b ?? 0)/pk.total_votes*100) : 50}% · {(pk.pool_b ?? 0)}豆</span>
                  </div>
                </div>

                {/* CTA 行 */}
                <div className="flex gap-2 items-center mt-1">
                  <div className="flex-1 text-[10px] text-[#9A9A9D]">起投 {pk.min_bet}豆</div>
                  <div className="flex gap-1.5">
                    <div className="px-3.5 py-1.5 rounded-[10px] border border-[#E7E7E8] text-xs text-brand-teal-dark font-medium">👀 围观</div>
                    <div className="px-4.5 py-1.5 rounded-[10px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-semibold shadow-[0_2px_8px_rgba(69,204,213,0.2)]">💰 下注</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── FAB按钮 ─── */}
      <div onClick={() => { if (!uid) { setShowLogin(true); return; } setShowCreate(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center justify-center flex-col text-xl font-light shadow-[0_4px_16px_rgba(69,204,213,0.35)] cursor-pointer z-[100] leading-none">
        <span className="-mt-0.5">+</span>
        <span className="text-[9px]">PK</span>
      </div>

      <style>{`
        @keyframes ping { 0%,100% { opacity:1;transform:scale(1) } 50%{opacity:.6;transform:scale(.8)} }
        @keyframes pulse { 0%,100% { opacity:1 } 50%{ opacity:.5 } }
      `}</style>

      {/* ─── 发起PK弹窗 ─── */}
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
