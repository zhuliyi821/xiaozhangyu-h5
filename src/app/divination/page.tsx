"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, RefreshCw, Share2, BookOpen } from "lucide-react";
import Link from "next/link";
import { TentacleLoader, RevealContainer, Confetti, ScoreCelebration, AnimatedNumber, GoldRipple, EmptyState, useDelight } from "@/lib/delight";

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

export default function DivinationPage() {
  const [step, setStep] = useState<"choose" | "result">("choose");
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState("time");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { celebration, celebrate } = useDelight();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  // 加载历史
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
      const res = await fetch(`/api/divination/cast?method=${m}&question=${encodeURIComponent(question)}&user_id=0`);
      const d = await res.json();
      if (d.code === 0 && d.data) {
        setReport(d.data);
        setStep("result");
        // 喜悦效果
        const score = d.data.conclusion.score;
        if (score >= 80) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500); }
        else if (score >= 50) { setShowRipple(true); setTimeout(() => setShowRipple(false), 1500); }
        celebrate(score >= 60 ? "good" : "info", score >= 80 ? "✨ 大吉之象！" : "卦象已现，请细细品读");
        // 存历史
        const entry = {
          id: Date.now(),
          time: d.data.basic.time,
          question: d.data.basic.question || "未命名",
          gua: d.data.overview.ben_gua.name,
          score: d.data.conclusion.score,
          data: d.data,
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

  // 爻线显示
  const YaoLine = ({ y, idx }: { y: Yaoyi; idx: number }) => (
    <div className={`flex items-center gap-2 py-1 ${y.changing ? "bg-red-50 -mx-2 px-2 rounded" : ""}`}>
      <span className="w-6 text-[10px] text-text-tertiary text-right">{idx+1}</span>
      <span className={`text-sm font-mono ${y.value ? "text-vermilion" : "text-bronze"}`}>
        {y.value ? "━━━━━" : "━ ━ ━"}
      </span>
      {y.changing && <span className="text-[9px] text-vermilion font-bold">●动</span>}
      <span className="text-[10px] text-text-secondary">{y.name}</span>
      <span className="text-[9px] text-text-tertiary ml-auto">{y.branch}{y.stem} {y.relation}</span>
      <span className={`text-[9px] px-1 rounded ${y.ri_chen === "旺" ? "bg-green-100 text-green-700" : y.ri_chen === "相" ? "bg-blue-100 text-blue-700" : "text-text-tertiary"}`}>
        {y.ri_chen}
      </span>
    </div>
  );

  // 标签页
  const [activeTab, setActiveTab] = useState<"method" | "report" | "history" | "aichat">("method");
  // 报告生成后自动切换到报告标签
  useEffect(() => {
    if (report && activeTab === "method") setActiveTab("report");
  }, [report]);

  const TABS = [
    { id: "method", label: "选方法" },
    { id: "report", label: "看报告" },
    { id: "history", label: "查历史" },
    { id: "aichat", label: "AI聊" },
  ];

  // 返回起卦页
  if (step === "choose") {
    return (
      <main className="min-h-screen bg-bg pb-20">
        <Confetti active={showConfetti} />
        <GoldRipple active={showRipple} />
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold">🐙 遇事随卦</span>
            </Link>
            <div className="flex-1 mx-3">
              <div className="flex bg-gray-100 rounded-full p-0.5">
                {TABS.map(tab => (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 text-[10px] py-1.5 rounded-full font-medium transition-all ${
                      activeTab === tab.id ? "bg-white text-text-primary shadow-sm" : "text-text-tertiary"
                    } ${tab.id === "report" && !report ? "opacity-40" : ""}`}
                    disabled={tab.id === "report" && !report}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] text-brand-teal flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {history.length}卦
            </button>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* 根据标签显示不同内容 */}
          {activeTab === "method" && (
            <>
              {/* 问题输入 — 跨标签持久化 */}
              <div className="mb-6">
                <label className="text-xs text-text-secondary mb-2 block">默念你的问题（选填）：</label>
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="如：是否适合换工作？"
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-brand-teal"
                />
              </div>

              {/* 三种起卦方式 */}
              <div className="space-y-3">
                <button onClick={() => doDivination("shake")} disabled={loading}
                  className="w-full bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark flex items-center justify-center text-2xl">📳</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">摇一摇起卦</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">手持手机，心中默念问题，点击摇动起卦</div>
                    </div>
                    <RefreshCw className={`w-5 h-5 text-brand-coral ${loading && method === "shake" ? "animate-spin" : ""}`} />
                  </div>
                </button>

            {loading && <TentacleLoader text="章鱼正在为你起卦…" />}

                <button onClick={() => doDivination("manual")} disabled={loading}
                  className="w-full bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center text-2xl">🪙</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">手动摇卦</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">模拟三枚铜钱，逐爻摇动六次成卦</div>
                    </div>
                    <span className="text-brand-gold text-sm">→</span>
                  </div>
                </button>

                <button onClick={() => doDivination("time")} disabled={loading}
                  className="w-full bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-2xl">⚡</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">时间起卦</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">以当前时间自动起卦</div>
                    </div>
                    <span className="text-brand-teal text-sm">→</span>
                  </div>
                </button>
              </div>

              <div className="text-[9px] text-text-tertiary text-center mt-6">
                每日免费 6 次 · 超出消耗 1000 游戏豆
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
              <div className="text-xs font-bold mb-3">📜 我的卦象（{history.length}卦）</div>
              {history.length === 0 ? (
                <EmptyState icon="🐙" title="还没有卦象记录"
                  subtitle="右上角点起卦，章鱼会为你推演"
                  action={{ label: "去起一卦", onClick: () => setActiveTab("method") }} />
              ) : (
                <div className="space-y-2">
                  {history.map((entry: any) => (
                    <button key={entry.id} onClick={() => loadHistory(entry)}
                      className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-left active:scale-[0.98] transition-transform">
                      <div>
                        <div className="text-xs font-medium">{entry.gua}</div>
                        <div className="text-[9px] text-text-tertiary">{entry.time} · {entry.question}</div>
                      </div>
                      <span className={`text-[10px] font-bold ${entry.score >= 60 ? "text-brand-teal-dark" : entry.score >= 40 ? "text-brand-gold-dark" : "text-brand-coral"}`}>
                        {entry.score}分
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "aichat" && (
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark flex items-center justify-center text-xs text-white">🦐</span>
                <div>
                  <div className="text-xs font-bold text-text-primary">小龙虾解卦</div>
                  <div className="text-[9px] text-text-tertiary">问吧，我帮你问章鱼老师</div>
                </div>
              </div>
              {report ? (
                <>
                  <div className="text-[10px] text-text-tertiary text-center py-6 leading-relaxed">
                    当前卦象：{report.overview.ben_gua.name} → {report.overview.bian_gua.name}
                    <br />点击下方问题直接问
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[["这卦什么意思", "本卦"],["动爻代表什么","动爻"],["吉凶如何","吉凶"],["体用怎么看","体用"],["纳甲是什么","纳甲"]].map(([q, tag]) => (
                      <button key={q}
                        className="text-[10px] bg-brand-teal/10 text-brand-teal-dark rounded-full px-3 py-1.5 active:scale-90 transition-transform hover:bg-brand-teal/20">
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon="🦐" title="先起一卦，再来问"
                  subtitle="小龙虾还没拿到章鱼的推算结果呢"
                  action={{ label: "去起一卦", onClick: () => setActiveTab("method") }} />
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
    <main className="min-h-screen bg-gradient-to-b from-brand-teal/5 via-bg to-brand-coral/5 text-text-primary pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setStep("choose")} className="flex items-center gap-2 text-brand-gold">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">返回</span>
          </button>
          <span className="text-xs font-bold bg-gradient-to-r from-brand-gold to-brand-coral bg-clip-text text-transparent">卦象报告</span>
          <button className="text-text-secondary"><Share2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* 起卦信息 */}
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-gold to-brand-coral" />
            <span className="text-[11px] font-bold text-text-primary">起卦信息</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div><span className="text-text-tertiary">时间</span><br/>{r.basic.time}</div>
            <div><span className="text-text-secondary">方式</span><br/>{r.basic.method === "time" ? "时间起卦" : r.basic.method === "shake" ? "摇一摇" : "手动摇卦"}</div>
            <div className="col-span-2"><span className="text-text-secondary">所问</span><br/>{r.basic.question || "未指定"}</div>
          </div>
        </div>

        {/* 一、卦象总览 */}
        <div className="bg-gradient-to-br from-brand-gold/5 to-brand-coral/5 border border-brand-gold/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-gold to-brand-coral" />
            <span className="text-xs font-bold text-brand-gold">一、卦象总览</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/80 backdrop-blur-sm border border-brand-gold/20 rounded-lg p-3">
              <div className="text-lg font-mono mb-1">{r.overview.ben_gua.upper_symbol}{r.overview.ben_gua.lower_symbol}</div>
              <div className="text-sm font-bold text-brand-coral">{r.overview.ben_gua.name}</div>
              <div className="text-[9px] text-text-secondary">本卦</div>
              <div className="text-[9px] mt-1">{r.overview.ben_gua.upper_name}{r.overview.ben_gua.lower_name}</div>
            </div>
            <div className="border border-gray-200/20 rounded-lg p-3">
              <div className="text-lg font-mono mb-1">{r.overview.bian_gua.upper_symbol}{r.overview.bian_gua.lower_symbol}</div>
              <div className="text-sm font-bold text-brand-teal-dark">{r.overview.bian_gua.name}</div>
              <div className="text-[9px] text-text-secondary">变卦</div>
            </div>
          </div>
          {r.overview.changing_yaos.length > 0 && (
            <div className="text-[10px] text-center mt-2 text-brand-coral">
              动爻：{'第' + r.overview.changing_yaos.map((i: number) => ['初','二','三','四','五','上'][i]).join('、') + '爻'}
            </div>
          )}
        </div>

        {/* 二、六爻排盘 */}
        <div className="bg-gradient-to-br from-brand-teal/5 to-white border border-brand-teal/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-teal to-brand-gold" />
            <span className="text-xs font-bold text-brand-teal-dark">二、六爻排盘</span>
          </div>
          <div className="space-y-0.5">
            {[...r.yao_pan].reverse().map((y: Yaoyi, i: number) => (
              <YaoLine key={i} y={y} idx={5-i} />
            ))}
          </div>
        </div>

        {/* 三、本卦解读 */}
        {r.ben_reading.gua_ci && (
          <div className="bg-gradient-to-br from-brand-gold-light/30 to-white border border-brand-gold/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-gold to-brand-teal" />
              <span className="text-xs font-bold text-brand-gold-dark">三、本卦解读 · {r.overview.ben_gua.name}</span>
            </div>
            <div className="space-y-3 text-[11px] leading-relaxed text-text-primary">
              <div><span className="text-text-secondary">📜 卦辞</span><br/>{r.ben_reading.gua_ci}</div>
              {r.ben_reading.da_xiang && <div><span className="text-text-secondary">📜 大象传</span><br/>{r.ben_reading.da_xiang}</div>}
              {r.ben_reading.tuan && <div><span className="text-text-secondary">📜 彖传</span><br/>{r.ben_reading.tuan}</div>}
            </div>
          </div>
        )}

        {/* 四、变卦解读 */}
        {r.bian_reading.gua_ci && (
          <div className="bg-gradient-to-br from-brand-teal/5 to-white border border-brand-teal/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-teal to-brand-coral" />
              <span className="text-xs font-bold text-brand-teal-dark">四、变卦解读 · {r.overview.bian_gua.name}</span>
            </div>
            <div className="text-[11px] leading-relaxed text-text-primary">
              <span className="text-text-secondary">📜 卦辞</span><br/>{r.bian_reading.gua_ci}
              {r.bian_reading.da_xiang && <><br/><br/><span className="text-text-secondary">📜 大象传</span><br/>{r.bian_reading.da_xiang}</>}
            </div>
          </div>
        )}

        {/* 五、动爻详解 */}
        {r.yao_details.length > 0 && (
          <div className="bg-gradient-to-br from-brand-coral/5 to-white border border-brand-coral/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-coral to-brand-gold" />
              <span className="text-xs font-bold text-brand-coral">五、动爻详解</span>
            </div>
            {r.yao_details.map((yd: any, i: number) => (
              <div key={i} className="text-[11px] leading-relaxed space-y-1">
                <div className="text-brand-gold">● {yd.name}爻动</div>
                {yd.text && <div><span className="text-text-secondary">爻辞</span><br/>{yd.text}</div>}
              </div>
            ))}
          </div>
        )}

        {/* 六、体用生克 */}
        <div className="bg-gradient-to-br from-brand-gold/5 to-brand-coral/5 border border-brand-gold/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-gold to-brand-teal" />
            <span className="text-xs font-bold text-brand-gold-dark">六、体用生克</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="text-text-secondary">体卦（你）</div>
              <div className="text-lg font-mono">{r.overview.ben_gua.lower_symbol}</div>
              <div>{r.body_use.body_trigram} · {r.body_use.body_element}</div>
            </div>
            <div>
              <div className="text-text-secondary">用卦（事）</div>
              <div className="text-lg font-mono">{r.overview.ben_gua.upper_symbol}</div>
              <div>{r.body_use.use_trigram} · {r.body_use.use_element}</div>
            </div>
          </div>
          <div className={`mt-2 text-center text-sm font-bold ${r.body_use.score <= 1 ? "text-brand-teal-dark" : r.body_use.score >= 3 ? "text-brand-coral" : "text-brand-gold"}`}>
            {r.body_use.relation}
          </div>
          <div className="mt-2 text-[10px] text-text-secondary text-center">
            变卦：{r.body_use.change_body_trigram}{r.body_use.change_use_trigram} · {r.body_use.change_relation}
          </div>
        </div>

        {/* 七、五行六亲 */}
        <div className="bg-gradient-to-br from-brand-teal/5 to-white border border-brand-teal/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-teal to-brand-gold" />
            <span className="text-xs font-bold text-brand-teal-dark">七、五行六亲</span>
          </div>
          <div className="text-xs font-bold text-brand-gold mb-3">七、五行六亲</div>
          <div className="text-[10px] text-text-secondary mb-2">卦宫：{r.six_relations.palace_name}{r.six_relations.palace_element}</div>
          {r.six_relations.lines.map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
              <span className="w-4 text-text-tertiary">{['初','二','三','四','五','上'][l.position]}</span>
              <span className={l.changing ? "text-brand-coral font-bold" : ""}>{l.relation}</span>
              <span className="text-text-secondary">{l.element}</span>
              <span className="text-text-secondary">{l.branch}</span>
              {l.position === r.six_relations.shi_yao && <span className="text-brand-gold text-[8px]">世</span>}
              {l.position === r.six_relations.ying_yao && <span className="text-brand-gold text-[8px]">应</span>}
            </div>
          ))}
        </div>

        {/* 八、纳甲分析 */}
        <div className="bg-gradient-to-br from-brand-coral/5 to-white border border-brand-coral/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-coral to-brand-teal" />
            <span className="text-xs font-bold text-brand-coral">八、纳甲分析</span>
          </div>
          <div className="space-y-1 text-[10px]">
            {[...r.nayin.lines].reverse().map((l: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 text-text-secondary">{l.name}</span>
                <span>{l.stem}{l.branch}</span>
                <span>{l.element}</span>
                <span className={`ml-auto ${l.ri_chen === "旺" ? "text-brand-teal" : l.ri_chen === "相" ? "text-brand-teal-light" : "text-text-secondary"}`}>
                  {l.ri_chen}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 九、综合论断 */}
        <div className={`bg-gradient-to-br from-brand-gold-light/20 to-brand-teal/5 border rounded-xl p-4 shadow-sm ${
          r.conclusion.score >= 60 ? "border-brand-teal/30" : r.conclusion.score >= 40 ? "border-brand-gold/30" : "border-brand-coral/30"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-gold to-brand-coral" />
            <span className="text-xs font-bold text-brand-gold-dark">九、综合论断</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">综合评分</span>
            <ScoreCelebration score={r.conclusion.score} />
            <span className={`text-lg font-bold ${
              r.conclusion.score >= 60 ? "text-brand-teal-dark" : r.conclusion.score >= 40 ? "text-brand-gold" : "text-brand-coral"
            }`}>
              <AnimatedNumber value={r.conclusion.score} />
            </span>
            <span className="text-[10px] text-text-secondary">/ 100</span>
          </div>
          {r.conclusion.advice.map((a: string, i: number) => (
            <div key={i} className="text-[11px] leading-relaxed text-text-primary border-t border-gray-200/20 pt-2 mt-2">
              {a}
            </div>
          ))}
        </div>

        {/* 十、互错综卦 */}
        <div className="bg-gradient-to-br from-brand-teal/5 to-brand-gold/5 border border-brand-teal/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-teal to-brand-coral" />
            <span className="text-xs font-bold text-brand-teal-dark">十、互卦 · 错卦 · 综卦</span>
          </div>
          <div className="space-y-3 text-[11px]">
            <div className="bg-white/50 rounded-lg p-2.5"><span className="text-text-secondary">互卦 {r.cross_ref.hu.upper}{r.cross_ref.hu.lower} · {r.cross_ref.hu.name}</span><br/>{r.cross_ref.hu.gua_ci}</div>
            <div className="bg-white/50 rounded-lg p-2.5"><span className="text-text-secondary">错卦 {r.cross_ref.cuo.upper}{r.cross_ref.cuo.lower} · {r.cross_ref.cuo.name}</span><br/>{r.cross_ref.cuo.gua_ci}</div>
            <div className="bg-white/50 rounded-lg p-2.5"><span className="text-text-secondary">综卦 {r.cross_ref.zong.upper}{r.cross_ref.zong.lower} · {r.cross_ref.zong.name}</span><br/>{r.cross_ref.zong.gua_ci}</div>
          </div>
        </div>

        {/* 操作区 */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => doDivination(method)}
            className="flex-1 bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white rounded-xl py-3 text-xs font-bold active:scale-[0.98] shadow-sm">
            🔄 重新起卦
          </button>
          <button onClick={() => { setStep("choose"); setReport(null); }}
            className="flex-1 bg-gradient-to-r from-brand-gold/10 to-brand-teal/10 text-brand-gold-dark border border-brand-gold/20 rounded-xl py-3 text-xs font-bold active:scale-[0.98] shadow-sm">
            📋 返回列表
          </button>
        </div>

        {/* 免责 */}
        <div className="text-[9px] text-text-tertiary text-center leading-relaxed mt-4 bg-gradient-to-r from-brand-teal/5 to-brand-coral/5 border border-brand-teal/10 rounded-xl p-3">
          ⚠️ 本报告由小章鱼AI基于周易六十四卦全量推演生成，仅供解惑参考。
        </div>
      </div>
    </main>
  );
}
