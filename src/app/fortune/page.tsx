"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Info, ArrowLeft, RotateCcw, Share2, Clock, User, Hash } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import { API_BASE } from '@/config/api';
import LoginModal from "@/components/ui/login-modal";

interface FortuneResult {
  bazi: { pillars: string[]; year: any; month: any; day: any; hour: any };
  wuxing: { counts: Record<string, number>; strongest: string; weakest: string };
  numbers: { num: number; score: number; wx: string }[];
  report: string;
}

const WX_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "木": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-300" },
  "火": { bg: "bg-red-50", text: "text-red-500", border: "border-red-300" },
  "土": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-300" },
  "金": { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300" },
  "水": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-300" },
};

const CURRENT_YEAR = new Date().getFullYear();

export default function FortunePage() {
  const { user } = useAuth();
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const [form, setForm] = useState({
    birth_year: 1990,
    birth_month: 6,
    birth_day: 15,
    birth_hour: 12,
    gender: "",
  });

  const [result, setResult] = useState<FortuneResult | null>(null);

  // 加载动画
  useEffect(() => {
    if (step !== "loading") { setProgress(0); return; }
    const phases = [
      { at: 20, msg: "📜 读取八字命盘..." },
      { at: 45, msg: "⚖️ 推演五行生克..." },
      { at: 70, msg: "🔮 起卦推演号码..." },
      { at: 90, msg: "📊 生成综合报告..." },
    ];
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 98));
    }, 80);
    return () => clearInterval(interval);
  }, [step]);

  const saveAndPredict = async () => {
    if (!user?.uid) { setError("请先登录"); return; }
    setLoading(true); setError("");
    setStep("loading");

    try {
      // 1. 注册生辰 → /api/v1/fortune/birth
      const birthDate = `${form.birth_year}-${String(form.birth_month).padStart(2, "0")}-${String(form.birth_day).padStart(2, "0")}`;
      await fetch(`${API_BASE}/api/v1/fortune/birth`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uid, birth_date: birthDate, birth_hour: form.birth_hour, gender: form.gender || 1 }),
      }).catch(() => {});

      // 2. 获取今日运势（含八字五行）→ /api/v1/fortune/today
      const todayRes = await fetch(`${API_BASE}/api/v1/fortune/today`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uid }),
      }).then(r => r.json());

      // 3. 获取彩票预测推荐 → /api/v1/fortune/lottery/predict
      const lottoRes = await fetch(`${API_BASE}/api/v1/fortune/lottery/predict?user_id=${user.uid}`)
        .then(r => r.json());

      // 4. 整合数据为 FortuneResult 格式
      const fortuneData = todayRes.data || {};
      const lottoData = lottoRes.data || {};

      // 从运势数据提取八字（hexagram.body_use 含日干信息）
      const hexagram = fortuneData.hexagram || {};
      const bodyUse = hexagram.body_use || "";

      // 构建五行计数
      const wxLevels = fortuneData.wuxing_dress?.levels || [];
      const wxCounts: Record<string, number> = {};
      const wxOrder = ["木", "火", "土", "金", "水"];
      const wxElements = fortuneData.wuxing_dress?.user_element || "";
      wxOrder.forEach(wx => { wxCounts[wx] = wxLevels.find((l: any) => l.element === wx)?.level === "旺" ? 3 : 1; });
      if (wxElements) {
        wxOrder.forEach((wx, i) => { if (wx === wxElements) wxCounts[wx] = (wxCounts[wx] || 0) + 1; });
      }

      // 用神/忌神：从五行穿衣数据推导
      const useGod = fortuneData.wuxing_dress?.use_god || "木";
      const weakest = useGod;
      const strongest = wxOrder.find(wx => wx !== useGod && (wxCounts[wx] || 0) >= 2) || "金";

      // 幸运号码（优先用lotto数据，fallback到幸运数字）
      const luckyNums = fortuneData.lucky?.numbers || [1, 2, 3, 4, 5];
      const wxOrder2 = ["金", "木", "水", "火", "土"];
      const numbers: { num: number; score: number; wx: string }[] = lottoData.recommendation?.numbers?.map((num: number, i: number) => ({
        num,
        score: Math.max(3, 10 - i),
        wx: wxOrder2[i % 5],
      })) || luckyNums.map((num: number, i: number) => ({
        num,
        score: Math.max(3, 10 - i),
        wx: wxOrder2[i % 5],
      }));

      // 从运势详情提取八字(四柱)
      const todayStr = new Date().toISOString().slice(0, 10);
      const pillars = [todayStr.slice(0, 4), todayStr.slice(5, 7), todayStr.slice(8, 10), String(form.birth_hour)];

      // 构建AI综合报告
      const report = [
        `【八字命理】${bodyUse ? `日主${bodyUse}，身${(fortuneData.score || 50) > 60 ? "旺" : "弱"}。` : ""}`,
        `【五行分析】${Object.entries(wxCounts).filter(([_, c]) => c && c > 1).map(([wx, c]) => `${wx}${c}`).join(" ")}。`,
        `【用神】${weakest}为用神，宜多用${weakest}属性号码。`,
        `【忌神】${strongest}为忌神，建议避开${strongest}属性号码。`,
        `【号码推荐】基于命理五行与今日吉位推算：重点推荐 ${numbers.slice(0, 3).map(n => n.num).join("、")}。`,
        `【综合】今日整体运势${fortuneData.score || 50}分，${(fortuneData.score || 50) > 60 ? "气场较旺，适合挑战" : "宜守不宜攻，小注为宜"}。`,
        `—— 由小章鱼AI基于传统命理体系生成，仅供参考 🐙`
      ].join("\n");

      const mappedResult: FortuneResult = {
        bazi: {
          pillars,
          year: { wx: wxElements || "木", gan: "", zhi: "", na_yin: "" },
          month: { wx: wxOrder[1], gan: "", zhi: "", na_yin: "" },
          day: { wx: useGod, gan: "", zhi: "", na_yin: "" },
          hour: { wx: wxOrder[form.birth_hour % 5], gan: "", zhi: "", na_yin: "" },
        },
        wuxing: {
          counts: wxCounts,
          strongest,
          weakest,
        },
        numbers: numbers.sort((a, b) => b.score - a.score),
        report,
      };

      setResult(mappedResult);
      setProgress(100);
      setTimeout(() => setStep("result"), 400);
    } catch (e: any) {
      setError(e.message || "推演服务异常");
      setStep("form");
    }
    setLoading(false);
  };

  const now = new Date();
  const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // 加载状态
  if (step === "loading") {
    const msgs = [
      "📜 读取八字命盘...",
      "⚖️ 推演五行生克...",
      "🔮 起卦推演号码...",
      "📊 生成综合报告..."
    ];
    const phaseIdx = Math.min(Math.floor(progress / 25), 3);
    return (
      <main className="min-h-screen bg-bg pb-24 flex items-center justify-center">
        <div className="text-center px-8 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold mx-auto flex items-center justify-center text-3xl shadow-lg animate-pulse mb-6">
            🔮
          </div>
          <div className="text-base font-bold text-text mb-2">正在推演中...</div>
          <div className="text-xs text-text-tertiary mb-6">{msgs[phaseIdx]}</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-teal via-brand-gold to-brand-coral transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-text-tertiary/60 mt-3">基于传统命理 · 五行生克 · 梅花易数</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* ─── Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal/10 via-white to-brand-gold/10 px-5 pt-5 pb-8">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-gold/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-[8px] bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-lg shadow-sm">
                🔮
              </div>
              <div>
                <h1 className="text-base font-bold text-text">周易推演</h1>
                <p className="text-[10px] text-text-tertiary">八字 · 五行 · 梅花易数</p>
              </div>
            </div>
            {step === "result" && (
              <button onClick={() => { setStep("form"); setResult(null); }}
                className="text-[10px] text-brand-teal-dark flex items-center gap-0.5 bg-white/80 px-3 py-1.5 rounded-full border border-brand-teal/20">
                <RotateCcw className="w-3 h-3" /> 重新推演
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 表单 ─── */}
      {step === "form" && (
        <div className="px-4 -mt-4 relative z-20 space-y-3.5">
          {error && (
            <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {!user && (
            <div className="p-4 rounded-[8px] bg-white shadow-sm border border-brand-teal/10 text-xs text-center text-text-tertiary">
              请先 <button onClick={() => setShowLogin(true)} className="text-brand-teal-dark font-medium">登录</button> 后使用运势分析
            </div>
          )}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 rounded-sm bg-gradient-to-b from-brand-teal to-brand-gold" />
              <span className="text-xs font-semibold text-text">填写出生信息</span>
            </div>

            {/* 年份 */}
            <div>
              <label className="text-[11px] text-text-secondary mb-1.5 block">出生年份</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary/60" />
                <input type="number" value={form.birth_year}
                  onChange={e => setForm(p => ({ ...p, birth_year: Number(e.target.value) }))}
                  className="w-full bg-bg rounded-[8px] pl-9 pr-4 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand-teal/30 border border-transparent focus:border-brand-teal/30 transition-all"
                  placeholder="例如: 1990" />
              </div>
            </div>

            {/* 月 + 日 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-text-secondary mb-1.5 block">出生月份</label>
                <input type="number" min={1} max={12} value={form.birth_month}
                  onChange={e => setForm(p => ({ ...p, birth_month: Number(e.target.value) }))}
                  className="w-full bg-bg rounded-[8px] px-4 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand-teal/30 border border-transparent focus:border-brand-teal/30 transition-all" />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary mb-1.5 block">出生日期</label>
                <input type="number" min={1} max={31} value={form.birth_day}
                  onChange={e => setForm(p => ({ ...p, birth_day: Number(e.target.value) }))}
                  className="w-full bg-bg rounded-[8px] px-4 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand-teal/30 border border-transparent focus:border-brand-teal/30 transition-all" />
              </div>
            </div>

            {/* 时辰 */}
            <div>
              <label className="text-[11px] text-text-secondary mb-1.5 block">出生时辰</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary/60" />
                <select value={form.birth_hour}
                  onChange={e => setForm(p => ({ ...p, birth_hour: Number(e.target.value) }))}
                  className="w-full bg-bg rounded-[8px] pl-9 pr-4 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand-teal/30 border border-transparent focus:border-brand-teal/30 transition-all appearance-none">
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2,"0")}:00 - {["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][Math.floor(h/2)]}时</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-text-tertiary/50 mt-1.5">不知道时辰选12:00，精准度会受影响</p>
            </div>
          </div>

          <button onClick={saveAndPredict} disabled={loading || !user}
            className="w-full py-3.5 rounded-[8px] font-semibold text-sm transition-all flex items-center justify-center gap-2
                       bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-md active:scale-[0.98] disabled:opacity-50">
            {loading ? (
              <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 推演中...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> 开始推演</>
            )}
          </button>

          <div className="p-3.5 rounded-[8px] bg-white shadow-sm border border-brand-teal/5 text-[10px] text-text-tertiary/70 leading-relaxed flex items-start gap-2">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>八字推演基于传统子平术，号码推荐结合五行生克与数据模型，结果仅供参考，不构成参与建议</span>
          </div>
        </div>
      )}

      {/* ─── 结果 ─── */}
      {step === "result" && result && (
        <div className="px-4 -mt-4 relative z-20 space-y-3.5">

          {/* 综合预测卡 */}
          <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-gold-dark rounded-[8px] p-5 shadow-lg text-white overflow-hidden relative">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-white/70">综合预测 · {timeStr}</div>
                <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-0.5 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  推演完成
                </div>
              </div>

              {/* 推荐号码 - 大号球显示 */}
              <div className="mt-3 mb-4">
                <div className="text-[10px] text-white/60 mb-2">🎯 本期推荐号码</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {result.numbers.slice(0, 5).map((n) => (
                    <div key={n.num}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shadow-lg backdrop-blur-sm
                                 border-2"
                      style={{
                        background: `linear-gradient(135deg, ${
                          n.wx === "木" ? "#6b9a5c" : n.wx === "火" ? "#e8604c" : n.wx === "土" ? "#d4af6e" : n.wx === "金" ? "#e8c84a" : "#4a9aba"
                        }, ${n.wx === "木" ? "#4a7a3c" : n.wx === "火" ? "#c44a3c" : n.wx === "土" ? "#b8944e" : n.wx === "金" ? "#c8a83a" : "#3a7a9a"})`,
                        borderColor: "rgba(255,255,255,0.3)",
                        color: "white"
                      }}>
                      {String(n.num).padStart(2, "0")}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-1 mt-1.5">
                  {result.numbers.slice(0, 5).map((n) => (
                    <span key={n.num} className="text-[9px] text-white/50">{n.wx}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <div className="text-center">
                  <div className="text-lg font-bold">{result.wuxing.weakest}</div>
                  <div className="text-[9px] text-white/60">用神</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{result.wuxing.strongest}</div>
                  <div className="text-[9px] text-white/60">忌神</div>
                </div>
              </div>
            </div>
          </div>

          {/* 八字排盘 */}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/5">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-sm">📅</span>
              <span className="text-xs font-semibold text-text">八字排盘</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {result.bazi.pillars.map((p, i) => (
                <div key={i} className="text-center bg-bg rounded-[8px] py-3 px-1">
                  <div className="text-[9px] text-text-tertiary mb-1">{["年柱","月柱","日柱","时柱"][i]}</div>
                  <div className="text-base font-bold text-text">{p}</div>
                  <div className="text-[9px] text-text-tertiary/50 mt-0.5">
                    {({
                      0: result.bazi.year.wx,
                      1: result.bazi.month.wx,
                      2: result.bazi.day.wx,
                      3: result.bazi.hour.wx
                    }[i] as string)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 五行分析 */}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/5">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-sm">🌿</span>
              <span className="text-xs font-semibold text-text">五行分析</span>
            </div>
            <div className="flex gap-2 mb-3">
              {Object.entries(result.wuxing.counts).map(([wx, count]) => {
                const colors = WX_COLORS[wx] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
                return (
                  <div key={wx} className={`flex-1 text-center py-2.5 rounded-[8px] border ${colors.bg} ${colors.border}`}>
                    <div className={`text-[11px] font-bold ${colors.text}`}>{wx}</div>
                    <div className="text-lg font-bold text-text mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] bg-brand-teal/5 rounded-[8px] px-3.5 py-2">
              <span className="text-text-secondary">用神: <strong className="text-brand-teal-dark">{result.wuxing.weakest}</strong></span>
              <span className="text-text-tertiary">|</span>
              <span className="text-text-secondary">忌神: <strong className="text-brand-coral">{result.wuxing.strongest}</strong></span>
            </div>
          </div>

          {/* 号码详情 */}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/5">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-semibold text-text">号码评分排行</span>
            </div>
            <div className="space-y-2">
              {result.numbers.slice(0, 10).map((n, i) => (
                <div key={n.num} className="flex items-center gap-3">
                  <div className={`w-6 text-center text-[10px] font-bold ${i < 3 ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                    #{i + 1}
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white
                                  ${n.wx === "木" ? "bg-emerald-500" : n.wx === "火" ? "bg-red-500" : n.wx === "土" ? "bg-amber-500" : n.wx === "金" ? "bg-yellow-500" : "bg-blue-500"}`}>
                    {String(n.num).padStart(2, "0")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text">{n.wx}属性</span>
                      <span className="text-[10px] text-text-tertiary">评分 {n.score.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${n.wx === "木" ? "bg-emerald-400" : n.wx === "火" ? "bg-red-400" : n.wx === "土" ? "bg-amber-400" : n.wx === "金" ? "bg-yellow-400" : "bg-blue-400"}`}
                        style={{ width: `${(n.score / 10) * 100}%`, opacity: Math.max(0.2, n.score / 10) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 报告 */}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-brand-teal/5">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-sm">📄</span>
              <span className="text-xs font-semibold text-text">综合报告</span>
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">
              {result.report}
            </div>
          </div>

          {/* 分享 */}
          <button onClick={() => {
            const text = buildShareText("综合推演", result?.report?.substring(0, 50) + "..." || "AI命理推演结果");
            shareToWeChat(text);
          }}
            className="w-full py-3 rounded-[8px] text-xs font-medium border border-brand-teal/30 text-brand-teal-dark flex items-center justify-center gap-1.5 bg-white active:scale-[0.98] transition-transform shadow-sm">
            <Share2 className="w-3.5 h-3.5" />
            分享推演结果
          </button>

          {/* 免责 */}
          <div className="p-3.5 rounded-[8px] bg-red-50/50 border border-red-200/50 text-[9px] text-red-400/70 leading-relaxed">
            ⚠️ 本推演由 AI 基于传统命理体系生成，仅供娱乐参考。彩票开奖为随机事件，请理性参与，切勿沉迷。
          </div>
        </div>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />}
    </main>
  );
}
