"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, RefreshCw, Share2, BookOpen, ChevronDown, MessageCircle } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import Link from "next/link";
import { TentacleLoader, Confetti, AnimatedNumber, GoldRipple, useDelight } from "@/lib/delight";
import { C } from "@/lib/brand-colors";

type Yaoyi = { position: number; name: string; value: number; changing: boolean; line_type: string; stem: string; branch: string; element: string; relation: string; ri_chen: string };

type Report = {
  basic: { time: string; method: string; question: string };
  overview: { ben_gua: any; bian_gua: any; hu_gua: any; cuo_gua: any; zong_gua: any; changing_yaos: number[] };
  yao_pan: Yaoyi[];
  ben_reading: any;
  bian_reading: any;
  yao_details: any[];
  body_use: any;
  six_relations: any;
  nayin: any;
  conclusion: { score: number; positive: string[]; negative: string[]; advice: string[] };
  cross_ref: any;
};

// ── 爻线 SVG 组件 ──
function GuaLines({ yao_pan, changing_yaos }: { yao_pan: Yaoyi[]; changing_yaos: number[] }) {
  const rows = [...yao_pan].reverse();
  return (
    <svg viewBox="0 0 48 72" className="w-full h-full">
      {rows.map((y: Yaoyi, i: number) => {
        const yPos = 4 + i * 11;
        const isChanging = changing_yaos.includes(y.position);
        return (
          <g key={i}>
            {y.value ? (
              <line x1="4" y1={yPos} x2="44" y2={yPos} stroke={C.teal} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={isChanging ? "4 3" : "none"} />
            ) : (
              <line x1="8" y1={yPos} x2="40" y2={yPos} stroke={C.coral} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray="6 5" />
            )}
            {isChanging && (
              <circle cx="40" cy={yPos} r="2.5" fill={C.gold} stroke="white" strokeWidth="1" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function DivinationPage() {
  const [step, setStep] = useState<"choose" | "result">("choose");
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState("time");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExpert, setShowExpert] = useState(false);
  const { celebration, celebrate } = useDelight();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("divination_history") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  const doDivination = async (m: string) => {
    setMethod(m);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/fortune/divination/cast?method=${m}&question=${encodeURIComponent(question)}&user_id=0`);
      const d = await res.json();
      if (d.code === 0 && d.data) {
        setReport(d.data);
        setStep("result");
        const score = d.data.conclusion.score;
        if (score >= 80) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500); }
        else if (score >= 50) { setShowRipple(true); setTimeout(() => setShowRipple(false), 1500); }
        celebrate(score >= 60 ? "good" : "info", score >= 80 ? "大吉之象！" : "卦象已现，请细细品读");
        const entry = {
          id: Date.now(), time: d.data.basic.time,
          question: d.data.basic.question || "未命名",
          gua: d.data.overview.ben_gua.name, score: d.data.conclusion.score, data: d.data,
        };
        const newHistory = [entry, ...history].slice(0, 100);
        setHistory(newHistory);
        localStorage.setItem("divination_history", JSON.stringify(newHistory));
      }
    } catch (e) {
      alert("起卦失败，请重试");
    }
    setLoading(false);
  };

  const loadHistory = (entry: any) => {
    setReport(entry.data);
    setStep("result");
    setShowHistory(false);
  };

  // ── choose page ──
  if (step === "choose") {
    return (
      <main className="min-h-screen bg-bg pb-20">
        <Confetti active={showConfetti} />
        <GoldRipple active={showRipple} />

        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-text-primary">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold">遇事随卦</span>
            </Link>
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-[10px] text-brand-teal font-medium bg-brand-teal/10 px-3 py-1.5 rounded-full">
              <BookOpen className="w-3 h-3" />
              记录·{history.length}卦
            </button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-5">

          {/* ── 问题输入 ── */}
          <div>
            <label className="text-xs text-text-secondary font-medium mb-2 block">心中有什么事？</label>
            <div className="relative">
              <input value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="如：是否适合换工作？"
                className="w-full bg-white rounded-[12px] px-4 py-3 text-sm border border-brand-teal/20 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all pr-10" />
              {question && (
                <button onClick={() => setQuestion("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">✕</button>
              )}
            </div>
          </div>

          {/* ── 三种起卦方式 ── */}
          <div>
            <div className="text-xs text-text-tertiary font-medium mb-3">选择起卦方式</div>
            <div className="space-y-3">

              <button onClick={() => doDivination("shake")} disabled={loading}
                className="w-full rounded-[12px] p-4 text-left active:scale-[0.98] transition-transform disabled:opacity-50 bg-gradient-to-br from-brand-coral/10 to-brand-coral/5 border border-brand-coral/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark flex items-center justify-center text-lg shrink-0 shadow-sm">📳</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary">摇一摇起卦</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">手持手机，默念问题后点击起卦</div>
                  </div>
                  <RefreshCw className={`w-5 h-5 text-brand-coral shrink-0 ${loading && method === "shake" ? "animate-spin" : ""}`} />
                </div>
              </button>

              <button onClick={() => doDivination("manual")} disabled={loading}
                className="w-full rounded-[12px] p-4 text-left active:scale-[0.98] transition-transform disabled:opacity-50 bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border border-brand-gold/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center text-lg shrink-0 shadow-sm">🪙</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary">手动摇卦</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">模拟三枚铜钱，逐爻摇动六次</div>
                  </div>
                  <span className="text-lg text-brand-gold shrink-0">→</span>
                </div>
              </button>

              <button onClick={() => doDivination("time")} disabled={loading}
                className="w-full rounded-[12px] p-4 text-left active:scale-[0.98] transition-transform disabled:opacity-50 bg-gradient-to-br from-brand-teal/10 to-brand-teal/5 border border-brand-teal/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-lg shrink-0 shadow-sm">⚡</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-primary">时间起卦</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">以当前时间自动起卦，一键可得</div>
                  </div>
                  <span className="text-lg text-brand-teal shrink-0">→</span>
                </div>
              </button>

            </div>
          </div>

          {loading && <TentacleLoader text="章鱼正在为你起卦…" />}

          <div className="text-[9px] text-text-tertiary text-center">每日免费 6 次 · 超出消耗 1000 游戏豆</div>

          {/* ── 历史记录 ── */}
          {showHistory && (
            <div className="bg-white rounded-[12px] p-4 border border-brand-teal/10 shadow-soft">
              <div className="text-[11px] font-bold text-text-primary mb-3">起卦记录（{history.length}）</div>
              {history.length === 0 ? (
                <div className="text-[10px] text-text-tertiary text-center py-6">还没有卦象记录，去起一卦吧</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry: any) => (
                    <button key={entry.id} onClick={() => loadHistory(entry)}
                      className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-left active:scale-[0.98] transition-transform">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium">{entry.gua}</div>
                        <div className="text-[9px] text-text-tertiary truncate">{entry.time} · {entry.question}</div>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 ml-2 ${
                        entry.score >= 60 ? "text-brand-teal-dark" : entry.score >= 40 ? "text-brand-gold-dark" : "text-brand-coral"
                      }`}>{entry.score}分</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    );
  }

  // ═══ 报告页 ═══
  if (!report) return null;
  const r = report;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-teal/[0.04] via-bg to-brand-coral/[0.04] pb-20">
      <Confetti active={showConfetti} />
      <GoldRipple active={showRipple} />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setStep("choose")} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-medium">返回</span>
          </button>
          <span className="text-[12px] font-bold text-text-primary">卦象报告</span>
          <button onClick={() => {
            const text = buildShareText("遇事随卦", "章鱼推演 · 卦象已出，来看看你的运势方向");
            shareToWeChat(text);
          }} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        {/* ════════ 1. 卦象总览 ════════ */}
        <section className="bg-white rounded-[12px] border border-brand-teal/10 shadow-soft overflow-hidden">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-brand-teal to-brand-teal-dark" />
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                <span className="text-[12px] font-bold text-text-primary">卦象总览</span>
              </div>

              <div className="flex items-center gap-4">
                {/* 本卦 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-[52px] h-[76px] bg-brand-teal/[0.06] border border-brand-teal/20 rounded-[8px] p-1 flex items-center justify-center shrink-0">
                    <GuaLines yao_pan={r.yao_pan} changing_yaos={r.overview.changing_yaos} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-brand-teal-dark">{r.overview.ben_gua.name}</div>
                    <div className="text-[10px] text-text-tertiary">本卦</div>
                    <div className="text-[9px] text-text-tertiary">{r.overview.ben_gua.upper_name}{r.overview.ben_gua.lower_name}</div>
                  </div>
                </div>

                {/* 箭头 */}
                <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 opacity-40">
                  <path d="M4 10h10M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* 变卦 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-[52px] h-[76px] bg-brand-gold/[0.06] border border-brand-gold/20 rounded-[8px] p-1 flex items-center justify-center shrink-0">
                    <GuaLines yao_pan={r.yao_pan} changing_yaos={r.overview.changing_yaos} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-brand-gold-dark">{r.overview.bian_gua.name}</div>
                    <div className="text-[10px] text-text-tertiary">变卦</div>
                  </div>
                </div>
              </div>

              {/* 底部摘要 */}
              <div className="mt-3 pt-3 border-t border-brand-teal/10 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">评分</span>
                  <span className={"text-sm font-bold " + (r.conclusion.score >= 60 ? "text-brand-teal-dark" : r.conclusion.score >= 40 ? "text-brand-gold-dark" : "text-brand-coral")}>
                    <AnimatedNumber value={r.conclusion.score} />
                  </span>
                </div>
                {r.overview.changing_yaos.length > 0 && (
                  <span className="text-text-tertiary">
                    动爻：{'第' + r.overview.changing_yaos.map((i: number) => ['初','二','三','四','五','上'][i]).join('、') + '爻'}
                  </span>
                )}
                {r.body_use && (
                  <span className={"text-[10px] font-medium " + (r.body_use.score <= 1 ? "text-brand-teal-dark" : "text-brand-gold-dark")}>
                    {r.body_use.relation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════ 2. 核心解读 ════════ */}
        <section className="bg-white rounded-[12px] border border-brand-gold/10 shadow-soft overflow-hidden">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-brand-gold to-brand-gold-dark" />
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-[12px] font-bold text-text-primary">核心解读</span>
              </div>
              <div className="text-[12px] leading-relaxed text-text-primary space-y-3">
                {r.ben_reading.gua_ci && (
                  <div>
                    <span className="text-text-tertiary text-[10px] font-medium">卦辞</span>
                    <p className="mt-0.5">{r.ben_reading.gua_ci}</p>
                  </div>
                )}
                {r.ben_reading.da_xiang && (
                  <div>
                    <span className="text-text-tertiary text-[10px] font-medium">大象传</span>
                    <p className="mt-0.5">{r.ben_reading.da_xiang}</p>
                  </div>
                )}
                {r.yao_details.map((yd: any, i: number) => (
                  <div key={i} className="bg-brand-coral/[0.04] border-l-2 border-brand-coral/30 pl-3 py-1.5 rounded-r-[4px]">
                    <span className="text-[10px] font-medium text-brand-coral">{yd.name}爻动</span>
                    {yd.text && <p className="mt-0.5 text-[12px]">{yd.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════ 3. 综合建议 ════════ */}
        {r.conclusion.advice.length > 0 && (
          <section className="bg-white rounded-[12px] border border-brand-coral/10 shadow-soft overflow-hidden">
            <div className="flex">
              <div className="w-1 shrink-0 bg-gradient-to-b from-brand-coral to-brand-coral-dark" />
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
                  <span className="text-[12px] font-bold text-text-primary">综合建议</span>
                </div>
                <div className="space-y-2">
                  {r.conclusion.advice.map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-coral mt-[5px] shrink-0" />
                      <span className="text-[12px] leading-relaxed text-text-primary">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════════ 4. AI深聊入口 ════════ */}
        <Link href={`/ai?tab=chat&context=divination-${encodeURIComponent(r.overview.ben_gua.name)}`}
          className="flex items-center gap-3 bg-gradient-to-r from-brand-teal/8 to-brand-coral/8 border border-brand-teal/20 rounded-[12px] px-4 py-3.5 active:scale-[0.98] transition-transform group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-coral-dark to-brand-coral flex items-center justify-center shrink-0 shadow-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-text-primary">还有疑惑？问小龙虾</div>
            <div className="text-[10px] text-text-tertiary">基于卦象，AI给你更深入的解释</div>
          </div>
          <span className="text-brand-teal text-sm shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        {/* ════════ 5. 专业内容（折叠） ════════ */}
        <div className="border-t border-brand-teal/10 pt-3">
          <button onClick={() => setShowExpert(!showExpert)}
            className="flex items-center justify-center gap-1.5 w-full text-[10px] text-text-tertiary hover:text-text-secondary transition-colors py-2">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExpert ? "rotate-180" : ""}`} />
            {showExpert ? "收起专业内容" : "展开专业内容"}
          </button>

          {showExpert && (
            <div className="space-y-3 mt-2">

              {/* 起卦信息 */}
              <div className="bg-white rounded-[10px] border border-brand-teal/10 p-3.5">
                <div className="text-[10px] font-bold text-text-secondary mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-gradient-to-b from-brand-gold to-brand-coral" />
                  起卦信息
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-text-tertiary">时间</span><br/>{r.basic.time}</div>
                  <div><span className="text-text-tertiary">方式</span><br/>{r.basic.method === "time" ? "时间起卦" : r.basic.method === "shake" ? "摇一摇" : "手动摇卦"}</div>
                  {r.basic.question && <div className="col-span-2"><span className="text-text-tertiary">所问</span><br/>{r.basic.question}</div>}
                </div>
              </div>

              {/* 六爻排盘 */}
              <div className="bg-white rounded-[10px] border border-brand-teal/10 p-3.5">
                <div className="text-[10px] font-bold text-text-secondary mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-gradient-to-b from-brand-teal to-brand-gold" />
                  六爻排盘
                </div>
                <div className="space-y-0.5">
                  {[...r.yao_pan].reverse().map((y: Yaoyi, i: number) => (
                    <div key={i} className={`flex items-center gap-2 py-0.5 text-[10px] ${y.changing ? "bg-brand-coral-light/20 -mx-1 px-1 rounded" : ""}`}>
                      <span className="w-4 text-text-tertiary text-right">{5-i+1}</span>
                      <span className="text-xs font-mono">{y.value ? "━━━" : "━ ━"}</span>
                      {y.changing && <span className="text-brand-gold text-[8px]">●动</span>}
                      <span className="text-text-secondary">{y.name}</span>
                      <span className="text-text-tertiary ml-auto">{y.branch}{y.stem}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 体用生克 */}
              {r.body_use && (
                <div className="bg-white rounded-[10px] border border-brand-teal/10 p-3.5">
                  <div className="text-[10px] font-bold text-text-secondary mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-brand-gold to-brand-teal" />
                    体用生克
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div><span className="text-text-tertiary">体卦（你）</span><br/><span className="text-sm font-mono">{r.overview.ben_gua.lower_symbol}</span><br/>{r.body_use.body_trigram} · {r.body_use.body_element}</div>
                    <div><span className="text-text-tertiary">用卦（事）</span><br/><span className="text-sm font-mono">{r.overview.ben_gua.upper_symbol}</span><br/>{r.body_use.use_trigram} · {r.body_use.use_element}</div>
                  </div>
                  <div className="text-center text-[11px] font-bold text-brand-teal-dark mt-2">{r.body_use.relation}</div>
                </div>
              )}

              {/* 五行六亲 */}
              {r.six_relations?.lines && (
                <div className="bg-white rounded-[10px] border border-brand-teal/10 p-3.5">
                  <div className="text-[10px] font-bold text-text-secondary mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-brand-teal to-brand-coral" />
                    五行六亲
                  </div>
                  <div className="text-[9px] text-text-tertiary mb-1">卦宫：{r.six_relations.palace_name}{r.six_relations.palace_element}</div>
                  <div className="space-y-0.5">
                    {r.six_relations.lines.map((l: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[9px]">
                        <span className="w-3 text-text-tertiary">{['初','二','三','四','五','上'][l.position]}</span>
                        <span className={l.changing ? "text-brand-coral font-bold" : ""}>{l.relation}</span>
                        <span className="text-text-secondary">{l.element}</span>
                        {l.position === r.six_relations.shi_yao && <span className="text-brand-gold text-[7px]">世</span>}
                        {l.position === r.six_relations.ying_yao && <span className="text-brand-gold text-[7px]">应</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 互错综卦 */}
              {r.cross_ref && (
                <div className="bg-white rounded-[10px] border border-brand-teal/10 p-3.5">
                  <div className="text-[10px] font-bold text-text-secondary mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-brand-teal to-brand-coral" />
                    互·错·综卦
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div><span className="text-text-tertiary">互卦</span> {r.cross_ref.hu.name}</div>
                    <div><span className="text-text-tertiary">错卦</span> {r.cross_ref.cuo.name}</div>
                    <div><span className="text-text-tertiary">综卦</span> {r.cross_ref.zong.name}</div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ════════ 操作区 ════════ */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => doDivination(method)}
            className="flex-1 bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white rounded-[12px] py-3 text-[12px] font-bold active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> 重新起卦
          </button>
          <button onClick={() => { setStep("choose"); setReport(null); }}
            className="flex-1 bg-white border border-brand-teal/10 text-text-primary rounded-[12px] py-3 text-[12px] font-bold active:scale-[0.98] transition-transform shadow-sm">
            返回列表
          </button>
        </div>

        {/* 免责 */}
        <div className="text-[9px] text-text-tertiary text-center leading-relaxed px-2">
          本报告由小章鱼AI基于周易六十四卦全量推演生成，仅供解惑参考。
        </div>
      </div>
    </main>
  );
}
