"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ChevronLeft, Sparkles, Flame, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { API_BASE } from "@/config/api";
import FortuneShare from "@/components/fortune/fortune-share";
import LoginModal from "@/components/ui/login-modal";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

// ── Types ──
interface WuxingLevel {
  level: string; relation: string; element: string;
  name: string; hex: string; shades: string[];
}
interface WuxingDress {
  day_element: string;
  levels: WuxingLevel[];
  advice: string;
  use_god?: string;
  user_element?: string;
  personalized?: boolean;
}

interface FortuneToday {
  score: number; tag: string; trend: string;
  advice: { do: string[]; dont: string[] };
  best_hour: { name: string; range: string; score: number; bonus: number };
  lucky: { color: string; color_hex: string; numbers: number[]; direction: string; level?: string; relation?: string; element?: string };
  wuxing_dress?: WuxingDress;
  hexagram?: Hexagram;
  body_use: string; body_use_label: string;
}

interface YaoItem {
  position: number; name: string; value: number;
  type: string; changing: boolean; text: string; symbol: string;
}
interface HexagramBrief { name: string; gua_ci?: string; body_trigram?: string; use_trigram?: string; body_symbol?: string; use_symbol?: string; }
interface Hexagram {
  name: string; gua_ci: string; body_trigram: string; use_trigram: string;
  body_use: string; body_use_tag?: string;
  yao?: YaoItem[]; changing_yao_indices?: number[];
  changed_hexagram?: HexagramBrief; interaction_hexagram?: HexagramBrief;
}
interface DimItem { score: number; level: string; advice: string; }
interface HourlyItem { hour: string; time_range: string; zhi_shi_door: string; score: number; label: string; bonus: number; advice: string; }

interface FortuneDetail {
  total_score: number;
  hexagram: Hexagram;
  dimensions: Record<string, DimItem>;
  hourly: HourlyItem[];
}
const DIM_ICONS: Record<string, string> = {
  wealth: "💰", love: "❤️", career: "💼", health: "🏥", social: "👥",
};
const DIM_LABELS: Record<string, string> = {
  wealth: "财运", love: "感情", career: "事业", health: "健康", social: "社交",
};

const WEEK_DAYS = ["日","一","二","三","四","五","六"];

// ── 出生信息设置表单 ──
function BirthInfoForm({ birthDate, setBirthDate, birthHour, setBirthHour, onSubmit, onClose }: {
  birthDate: string; setBirthDate: (v: string) => void;
  birthHour: string; setBirthHour: (v: string) => void;
  onSubmit: () => void; onClose?: () => void;
}) {
  return (
    <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 text-left">
      <div className="text-xs font-semibold text-brand-teal-dark mb-3">📅 设置出生信息</div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-text-secondary mb-1 block">出生日期</label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" />
        </div>
        <div>
          <label className="text-[10px] text-text-secondary mb-1 block">出生时辰</label>
          <select value={birthHour} onChange={e => setBirthHour(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-xs outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20">
            {["子时(23-01)","丑时(01-03)","寅时(03-05)","卯时(05-07)","辰时(07-09)","巳时(09-11)",
              "午时(11-13)","未时(13-15)","申时(15-17)","酉时(17-19)","戌时(19-21)","亥时(21-23)"]
              .map((label, i) => <option key={i} value={i}>{label}</option>)}
          </select>
        </div>
        <button onClick={onSubmit}
          className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-xs font-semibold active:scale-[0.97] transition-transform shadow-sm">
          生成我的运势
        </button>
      </div>
    </div>
  );
}

function scoreColor(s: number): string {
  if (s >= 85) return "text-emerald-600";
  if (s >= 70) return "text-brand-teal-dark";
  if (s >= 55) return "text-amber-600";
  return "text-red-500";
}
function scoreBg(s: number): string {
  if (s >= 85) return "bg-gradient-to-r from-emerald-400 to-emerald-300";
  if (s >= 70) return "bg-gradient-to-r from-brand-teal to-brand-teal-dark";
  if (s >= 55) return "bg-gradient-to-r from-amber-400 to-amber-300";
  return "bg-gradient-to-r from-red-400 to-red-300";
}
function scoreLevel(s: number): string {
  if (s >= 85) return "上吉";
  if (s >= 70) return "中吉";
  if (s >= 55) return "中平";
  return "小凶";
}
export default function DailyFortunePage() {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;
  const weekDay = WEEK_DAYS[today.getDay()];

  const [todayData, setTodayData] = useState<FortuneToday | null>(null);
  const [detailData, setDetailData] = useState<FortuneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showBirthForm, setShowBirthForm] = useState(false);
  const [birthDate, setBirthDate] = useState("1990-06-15");
  const [birthHour, setBirthHour] = useState("12");
  const [guestMode, setGuestMode] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function load() {
      const uid = (user as any)?.uid || 0;
      const token = (user as any)?.token || "";
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      // Only call API for explicitly triggered guest mode or logged-in users
      if (guestMode) {
        try {
          const payload = uid ? { user_id: uid } : { user_id: 0 };
          if (!uid && birthDate) {
            Object.assign(payload, { birth_date: birthDate, birth_hour: parseInt(birthHour) });
          }
          const [todayRes, detailRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/fortune/today`, {
              method: "POST", headers: authHeaders,
              body: JSON.stringify(payload),
            }).then(r => r.json()),
            fetch(`${API_BASE}/api/v1/fortune/detail`, {
              method: "POST", headers: authHeaders,
              body: JSON.stringify(payload),
            }).then(r => r.json()),
          ]);
          if (todayRes.code === 0) setTodayData(todayRes.data);
          if (detailRes.code === 0) setDetailData(detailRes.data);
          if (todayRes.code !== 0 && !uid) {
            // Guest mode without birth info: show form instead of error
            setError("");
          } else if (todayRes.code !== 0) {
            setError(todayRes.msg || "数据加载异常");
          }
        } catch {
          setError("服务暂时不可用，请稍后再试");
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        // Register birth if user has set one
        if (birthDate) {
          await fetch(`${API_BASE}/api/v1/fortune/birth`, {
            method: "POST", headers: authHeaders,
            body: JSON.stringify({ user_id: uid, birth_date: birthDate, birth_hour: parseInt(birthHour), gender: 1 }),
          }).catch(() => console.warn("请求 失败"));
        }

        const [todayRes, detailRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/fortune/today`, {
            method: "POST", headers: authHeaders,
            body: JSON.stringify({ user_id: uid || 1 }),
          }).then(r => r.json()),
          fetch(`${API_BASE}/api/v1/fortune/detail`, {
            method: "POST", headers: authHeaders,
            body: JSON.stringify({ user_id: uid || 1 }),
          }).then(r => r.json()),
        ]);

        if (todayRes.code === 0) setTodayData(todayRes.data);
        if (detailRes.code === 0) setDetailData(detailRes.data);
        if (todayRes.code !== 0 || detailRes.code !== 0) {
          setError(todayRes.msg || detailRes.msg || "数据加载异常");
        }
      } catch (e) {
        setError("加载失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, retryKey, guestMode, birthDate, birthHour]);

  // Current hour index
  const currentHourIndex = useMemo(() => {
    const h = today.getHours();
    return Math.floor(h / 2) % 12;
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-teal-light/20 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-2xl mb-3 animate-bounce">🐙</div>
          <div className="text-xs text-brand-teal animate-pulse">正在为你推演今日运势…</div>
        </div>
      </main>
    );
  }

  const td = todayData;
  const dd = detailData;
  const isLoggedIn = !!(user as any)?.uid;

  if (!td || !dd) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-teal-light/20 via-white to-white flex items-center justify-center px-6">
        <div className="text-center w-full max-w-sm">
          {!isLoggedIn && !guestMode ? (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-teal to-brand-coral flex items-center justify-center text-4xl mb-4 shadow-lg">🐙</div>
              <h2 className="text-lg font-bold text-brand-teal-dark mb-2">每日一卦</h2>
              <p className="text-xs text-text-tertiary mb-6 leading-relaxed">
                登录后获取专属于你的今日八字运势<br />
                包含体用生克、奇门遁甲、六十四卦全方位推演
              </p>
              <div className="space-y-2.5">
                <button onClick={() => setShowLogin(true)}
                  className="w-full py-3 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-semibold active:scale-[0.97] transition-transform shadow-sm">
                  登录查看运势
                </button>
                <button onClick={() => { setGuestMode(true); setLoading(true); setRetryKey(k => k + 1); }}
                  className="w-full py-2.5 border border-gray-200 text-text-secondary rounded-[8px] text-xs font-medium active:scale-[0.97] transition-transform">
                  游客体验（无个性化）
                </button>
              </div>
              <Link href="/" className="mt-6 inline-block text-[10px] text-text-tertiary underline">返回首页</Link>
              {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-coral-light/30 flex items-center justify-center text-3xl mb-3">
                <AlertCircle className="w-8 h-8 text-brand-coral" />
              </div>
              <p className="text-xs text-text-secondary mb-4">{error === "数据加载异常" ? "暂时无法获取您的专属运势，试试游客模式" : error}</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => { setError(""); setLoading(true); setRetryKey(k => k + 1); }}
                  className="px-5 py-2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-xs font-medium active:scale-[0.97] transition-transform">
                  重试
                </button>
                <button onClick={() => { setGuestMode(true); setLoading(true); setRetryKey(k => k + 1); }}
                  className="px-5 py-2 border border-gray-200 text-text-secondary rounded-[8px] text-xs font-medium active:scale-[0.97] transition-transform">
                  游客模式
                </button>
              </div>
              <Link href="/" className="mt-4 inline-block text-[10px] text-text-tertiary underline">返回首页</Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-teal-light/30 flex items-center justify-center text-3xl mb-3">
                <Sparkles className="w-7 h-7 text-brand-teal" />
              </div>
              <p className="text-xs text-text-secondary mb-4">请先设置出生信息以获取精准运势</p>
              <BirthInfoForm
                birthDate={birthDate} setBirthDate={setBirthDate}
                birthHour={birthHour} setBirthHour={setBirthHour}
                onSubmit={() => { setError(""); setLoading(true); setRetryKey(k => k + 1); setShowBirthForm(false); }}
                onClose={() => setShowBirthForm(false)}
              />
              <Link href="/" className="mt-4 inline-block text-[10px] text-text-tertiary underline">返回首页</Link>
            </>
          )}
        </div>
      </main>
    );
  }

  // 优先用 today API 的完整 hexagram（含爻辞/变卦），fallback 到 detail 数据
  const hexagram = (td.hexagram && td.hexagram.yao ? td.hexagram : dd.hexagram);
  const dims = dd.dimensions;
  const hourly = dd.hourly || [];
  const nowHour = hourly[currentHourIndex] || hourly[0] || null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-teal-light/20 via-white to-white pb-28">
      {/* ─── 顶部导航 ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-brand-teal-light/20 flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-brand-teal" />
          </Link>
          <div className="flex-1 text-center text-sm font-bold text-brand-teal-dark -ml-8">小章鱼今日运势</div>
          <FortuneShare
            score={td.score}
            tag={td.tag}
            dimensions={dims}
            advice={td.advice}
            lucky={td.lucky}
            bestHour={{ name: td.best_hour.name, score: td.best_hour.score }}
          />
        </div>
      </div>

      <div className="px-4 pt-5">

        {/* ═══════ Hero 区 ═══════ */}
        <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-dark rounded-[8px] p-6 mb-5 text-white shadow-lg shadow-brand-teal/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-white/70">{dateStr} 星期{weekDay}</div>
              <div className="text-lg font-bold mt-0.5">小章鱼今日运势</div>
            </div>
            <div className="text-3xl">🐙</div>
          </div>

          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-5xl font-bold tracking-tight">{td.score}<span className="text-lg font-normal text-white/70 ml-1">分</span></div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-white/20 rounded-full px-3 py-0.5 font-medium">{td.tag}</span>
                <span className="text-[10px] text-white/70">{td.body_use}·{td.body_use_label}</span>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`text-base ${i <= Math.round(td.score/20) ? "text-yellow-300" : "text-white/30"}`}>⭐</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-[8px] px-3.5 py-2.5">
              <div className="text-[9px] text-green-300 font-medium mb-0.5">✅ 今日宜</div>
              <div className="text-xs font-bold">{td.advice.do.join(" · ")}</div>
            </div>
            <div className="flex-1 bg-white/10 rounded-[8px] px-3.5 py-2.5">
              <div className="text-[9px] text-red-300 font-medium mb-0.5">❌ 今日忌</div>
              <div className="text-xs font-bold">{td.advice.dont.join(" · ")}</div>
            </div>
          </div>
        </div>

        {/* ═══════ 卦象区 — 墨朱爻线 · 正宗六爻 ═══════ */}
        <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-bold text-brand-teal-dark">今日卦象</span>
          </div>

          <div className="flex gap-4">
            {/* 本卦六爻 */}
            <div className="flex-shrink-0">
              <div className="text-[9px] text-gray-400 mb-1 text-center">本卦</div>
              <div className="bg-brand-teal-light/10 rounded-[8px] p-2.5 border border-brand-teal-light/30">
                {hexagram.yao && [...hexagram.yao].reverse().map((y, i) => {
                  const isChanging = y.changing;
                  return (
                    <div key={i} className="flex items-center gap-1.5 py-1">
                      <div className={`w-8 h-[5px] ${y.value === 1
                        ? "bg-brand-teal-dark"
                        : "bg-transparent border-t-2 border-brand-teal-dark/60"
                      } ${isChanging ? "shadow-[0_0_6px_rgba(242,113,82,0.6)]" : ""}`} />
                      {isChanging && (
                        <span className="text-[10px] text-brand-coral font-bold">◉</span>
                      )}
                      <span className="text-[8px] text-gray-500 ml-auto">{y.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 变卦 */}
            {hexagram.changed_hexagram && (
              <div className="flex-shrink-0">
                <div className="text-[9px] text-gray-400 mb-1 text-center">变卦</div>
                <div className="bg-gray-50 rounded-[8px] p-2.5 border border-gray-100">
                  {hexagram.yao && [...hexagram.yao].reverse().map((y, i) => {
                    const changedValue = y.changing ? 1 - y.value : y.value;
                    return (
                      <div key={i} className="flex items-center gap-1.5 py-1">
                        <div className={`w-8 h-[5px] ${changedValue === 1
                          ? "bg-gray-400"
                          : "bg-transparent border-t-2 border-gray-400/60"
                        }`} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-gray-500 text-center mt-0.5">{hexagram.changed_hexagram.name}</div>
              </div>
            )}

            {/* 卦信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-brand-teal-dark">{hexagram.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-gray-400">{hexagram.body_trigram}{hexagram.use_trigram}</span>
                <span className="text-[10px] text-brand-teal bg-brand-teal-light/20 rounded-sm px-1.5 py-0.5 font-medium">{hexagram.body_use}</span>
                {hexagram.body_use_tag && (
                  <span className="text-[9px] text-gray-400">· {hexagram.body_use_tag}</span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 italic leading-relaxed">&ldquo;{hexagram.gua_ci}&rdquo;</div>

              {/* 动爻爻辞 */}
              {hexagram.changing_yao_indices && hexagram.changing_yao_indices.length > 0 && hexagram.yao && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {hexagram.changing_yao_indices.map(idx => {
                    const y = hexagram.yao![idx];
                    return (
                      <div key={idx} className="text-[9px] text-brand-coral mt-1 leading-relaxed">
                        ◉ {y.text}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 互卦 */}
              {hexagram.interaction_hexagram && (
                <div className="mt-1.5 text-[9px] text-gray-400">
                  互卦：{hexagram.interaction_hexagram.use_symbol}{hexagram.interaction_hexagram.body_symbol} {hexagram.interaction_hexagram.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ 五行穿衣指南 — 全面优化版 ═══════ */}
        {td.wuxing_dress && (() => {
          const wd = td.wuxing_dress;
          const useGodName = wd.use_god || "";
          const userEl = wd.user_element || "";
          const isPersonalized = wd.personalized || false;
          const dayEl = wd.day_element || "";
          const WUXING_ROW = [
            { key: "金", icon: "⚜️" }, { key: "木", icon: "🌿" }, { key: "水", icon: "💧" },
            { key: "火", icon: "🔥" }, { key: "土", icon: "⛰️" },
          ];
          const dayIdx = WUXING_ROW.findIndex(w => w.key === dayEl);
          const lc = (level: string) => {
            if (level === "大吉") return "text-emerald-600";
            if (level === "吉") return "text-blue-600";
            if (level === "平") return "text-amber-600";
            return "text-red-600";
          };
          const dc = (level: string) => {
            if (level === "大吉") return "#4CAF50"; if (level === "吉") return "#2196F3";
            if (level === "平") return "#FFC107"; return "#F44336";
          };
          return (
          <div className="bg-white rounded-[8px] shadow-sm border border-gray-100 mb-5 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-4 pt-4 pb-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">&#128085;</span>
                <span className="text-sm font-bold">今日五行穿衣</span>
                {isPersonalized && <span className="text-[9px] bg-white/20 px-2 py-0.5 ml-auto">个性化</span>}
              </div>
              <div className="flex items-center justify-center gap-2">
                {WUXING_ROW.map((wx, i) => (
                  <div key={wx.key} className="flex flex-col items-center gap-0.5">
                    <div className={`w-9 h-9 flex items-center justify-center text-base ${i === dayIdx ? "bg-white/20 text-white rounded-[8px] scale-110" : "text-white/50"}`}>{wx.icon}</div>
                    <span className={`text-[9px] ${i === dayIdx ? "text-white font-bold" : "text-white/40"}`}>{wx.key}</span>
                    {i === dayIdx && <span className="text-[7px] bg-white/20 text-white px-1">旺</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 pt-3 pb-2 flex gap-2 flex-wrap border-b border-gray-50">
              <span className="text-[10px] bg-brand-teal-light/30 text-brand-teal-dark px-2.5 py-1 font-medium">今日五行：{dayEl}旺</span>
              {isPersonalized && useGodName && <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 font-medium border border-amber-200">⭐ 你的用神：{useGodName}</span>}
              {isPersonalized && userEl && <span className="text-[10px] bg-brand-teal-light/30 text-brand-teal-dark px-2.5 py-1 font-medium">日主：{userEl}</span>}
            </div>
            <div className="px-4 py-3">
              {wd.levels.map((lv: any, i: number) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-4 h-4 rounded-sm" style={{ background: dc(lv.level) }} />
                    <span className={`text-[11px] font-bold ${lc(lv.level)}`}>{lv.level}</span>
                    <span className="text-[10px] text-gray-500">· {lv.name}系</span>
                    <span className="text-[8px] text-gray-400 ml-auto">{lv.relation || ""}</span>
                  </div>
                  <div className="flex gap-2.5">
                    {lv.shades.map((s: string, si: number) => (
                      <div key={si} className="w-10 h-10 rounded-md shadow-sm border border-gray-100/50" style={{ background: s }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-100 mx-4" />
            <div className="px-4 py-3">
              <div className="bg-gradient-to-r from-brand-teal-light/30 to-brand-teal-light/10 rounded-[10px] p-3">
                <div className="text-[10px] font-medium text-brand-teal-dark mb-1">&#128161; 小章鱼穿搭建议</div>
                <div className="text-[11px] text-text-secondary leading-relaxed">&ldquo;{wd.advice}&rdquo;</div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] border border-gray-200 text-[11px] text-brand-teal-dark font-medium bg-white hover:bg-gray-50 active:scale-[0.97] transition-transform"
                onClick={async () => {
                  const t = buildShareText("今日五行穿衣指南", `等级·色系\n${wd.levels.map((l: any) => `${l.level}·${l.name}系`).join("\n")}\n\n💡 ${wd.advice}`);
                  await shareToWeChat(t);
                }}>
                <span>&#128229;</span>
                <span>分享穿衣指南</span>
              </button>
            </div>
          </div>
          );
        })()}


        {/* ═══════ 5维度 ═══════ */}
        <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-brand-teal-dark">运势维度</span>
          </div>
          <div className="space-y-3.5">
            {Object.entries(dims).map(([key, dim]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{DIM_ICONS[key] || "📊"}</span>
                    <span className="text-[11px] font-medium text-brand-teal-dark">{DIM_LABELS[key] || key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${scoreColor(dim.score)}`}>{dim.score}分</span>
                    <span className="text-[9px] text-gray-400">{dim.level}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-brand-teal-light/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBg(dim.score)} transition-all duration-700`} style={{ width: `${dim.score}%` }} />
                </div>
                <div className="text-[9px] text-gray-400/60 mt-0.5">{dim.advice}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ 幸运信息 ═══════ */}
        <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-bold text-brand-teal-dark">幸运指南</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-teal-light/15 rounded-[8px] p-3">
              <div className="text-[9px] text-gray-400 mb-1">🎨 幸运色</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ background: td.lucky.color_hex }} />
                <div>
                  <span className="text-xs font-bold text-brand-teal-dark">{td.lucky.color}</span>
                  {td.wuxing_dress && <span className="text-[8px] text-brand-teal ml-1">({td.lucky.level || "大吉"})</span>}
                </div>
              </div>
              <div className="text-[8px] text-gray-400/60 mt-0.5">{td.lucky.color_hex}</div>
            </div>
            <div className="bg-brand-teal-light/15 rounded-[8px] p-3">
              <div className="text-[9px] text-gray-400 mb-1">🔢 幸运数字</div>
              <div className="flex items-center gap-2">
                {td.lucky.numbers.map((n, i) => (
                  <span key={i} className="w-7 h-7 rounded-full bg-brand-teal-light/30 flex items-center justify-center text-xs font-bold text-brand-teal-dark">{n}</span>
                ))}
              </div>
            </div>
            <div className="bg-brand-teal-light/15 rounded-[8px] p-3">
              <div className="text-[9px] text-gray-400 mb-1">📍 幸运方位</div>
              <div className="text-xs font-bold text-brand-teal-dark">{td.lucky.direction}</div>
            </div>
            <div className="bg-brand-teal-light/15 rounded-[8px] p-3">
              <div className="text-[9px] text-gray-400 mb-1">⏰ 最佳时段</div>
              <div className="text-xs font-bold text-brand-teal-dark">{td.best_hour.name} ({td.best_hour.range})</div>
              <div className="text-[9px] text-brand-teal mt-0.5">加成 +{td.best_hour.bonus}%</div>
            </div>
          </div>
        </div>

        {/* ═══════ 当前时辰 ═══════ */}
        {nowHour && (
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[8px] p-5 shadow-sm mb-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/80" />
                <span className="text-xs font-bold">当前时辰 · {nowHour.hour} ({nowHour.time_range})</span>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-0.5 text-[10px] font-medium">{nowHour.zhi_shi_door}</div>
            </div>
            <div className="flex items-end justify-between mb-2">
              <div className="text-3xl font-bold">{nowHour.score}<span className="text-base font-normal text-white/70 ml-1">分</span></div>
              <div className="text-right">
                <div className="text-xs font-medium">{nowHour.label}</div>
                {nowHour.bonus > 0 && <div className="text-[10px] text-yellow-300">预测加成 +{nowHour.bonus}%</div>}
              </div>
            </div>
            <div className="text-xs text-white/80">{nowHour.advice}</div>
          </div>
        )}

        {/* ═══════ 12时辰走势 ═══════ */}
        <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-brand-teal-dark">今日时辰运势走势</span>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-1">
            <div className="flex gap-2 min-w-max px-1">
              {hourly.map((h, i) => {
                const isNow = i === currentHourIndex;
                return (
                  <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-[8px] min-w-[52px] transition-all ${isNow ? "bg-brand-teal-light/30 ring-2 ring-brand-teal ring-offset-1" : "bg-brand-teal-light/10"}`}>
                    <div className="text-[9px] text-brand-teal font-medium">{h.hour}</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${scoreBg(h.score)}`}>
                      {h.score}
                    </div>
                    <div className="text-[8px] text-gray-400">{h.zhi_shi_door}</div>
                    {h.bonus > 0 && <div className="text-[7px] text-brand-gold font-bold">+{h.bonus}%</div>}
                    {isNow && <div className="text-[7px] text-brand-teal-dark font-bold">← 现在</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-[9px] text-gray-400">
            <span>🟣 上吉</span><span>🟢 中吉</span><span>🟡 中平</span><span>🔴 小凶</span>
          </div>
        </div>

        {/* ═══════ 运势助手 — 白底卡片 ═══════ */}
        <div className="mb-5">
          <Link href="/ai?tab=chat" className="block bg-white rounded-[8px] p-8 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 flex items-center justify-center text-4xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="24" cy="30" rx="6" ry="9" fill="#fff" opacity="0.9"/>
                    <ellipse cx="24" cy="20" rx="5.5" ry="4.5" fill="#fff" opacity="0.9"/>
                    <circle cx="24" cy="14" r="6" fill="none" stroke="#fff" strokeWidth="1.5"/>
                    <path d="M13 19L6 15M35 19L42 15M10 28L3 32M38 28L45 32" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-brand-teal-dark">小龙虾</div>
                <div className="text-[11px] text-gray-400 mt-1">我是你跟班，有事找我聊。</div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] bg-brand-teal-light/20 text-brand-teal-dark rounded-[6px] px-2.5 py-1 font-medium">💰 财运推演</span>
                <span className="text-[10px] bg-brand-teal-light/20 text-brand-teal-dark rounded-[6px] px-2.5 py-1 font-medium">❤️ 情感分析</span>
                <span className="text-[10px] bg-brand-teal-light/20 text-brand-teal-dark rounded-[6px] px-2.5 py-1 font-medium">💼 事业指引</span>
              </div>
              <div className="text-[10px] text-brand-teal font-medium flex items-center gap-1 mt-1">
                去问问AI <span className="text-xs">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 免责声明 */}
        <div className="p-3.5 rounded-[8px] bg-brand-teal-light/10 border border-gray-100 text-[9px] text-gray-400/60 text-center leading-relaxed">
          本运势由 AI 基于八字命理 · 奇门遁甲 · 六十四卦算法综合生成，仅供娱乐参考。<br />
          事在人为，保持积极心态方能顺势而行。
        </div>

      </div>
    </main>
  );
}
