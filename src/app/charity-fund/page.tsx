"use client";

/**
 * ❤️ 公益资金池
 *
 * 资金来源：
 *   - 公益PK输家投票80%
 *   - 民众捐赠（真实扣credit1）
 *   - 对外赞助
 *   - 投票决定资金分配
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { CHARITY_PROJECTS } from "@/app/pk-hall/types";
import { API_BASE } from "@/config/api";
import Link from "next/link";
import { Heart, TrendingUp, Gift, Users, Target, ChevronDown, ChevronUp, RefreshCw, Coins } from "lucide-react";

// ─── 模拟数据（Phase 1：待连接后端API） ───
const FUND_METRICS = {
  total_fund: 284560,
  monthly_inflow: 38200,
  total_donors: 1583,
  total_sponsors: 12,
  projects_funded: 5,
};

const FUND_SOURCES = [
  { label: "公益PK（输家80%）", amount: 184200, pct: 65, color: "bg-brand-coral" },
  { label: "民众捐赠", amount: 52340, pct: 18, color: "bg-brand-teal" },
  { label: "对外赞助", amount: 36820, pct: 13, color: "bg-brand-gold" },
  { label: "平台配捐", amount: 11200, pct: 4, color: "bg-purple-500/60" },
];

const RECENT_DONATIONS = [
  { name: "王**", amount: 5000, time: "2小时前", type: "个人捐赠" },
  { name: "某连锁超市", amount: 15000, time: "昨天", type: "赞助" },
  { name: "张**", amount: 2000, time: "昨天", type: "个人捐赠" },
  { name: "XX科技公司", amount: 30000, time: "3天前", type: "赞助" },
  { name: "李**", amount: 1000, time: "3天前", type: "个人捐赠" },
];

const SPONSOR_LEVELS = [
  { level: "❤️ 爱心伙伴", min: 1000, color: "bg-brand-coral/10 text-brand-coral", desc: "1,000豆起" },
  { level: "💎 钻石赞助", min: 10000, color: "bg-brand-gold/10 text-brand-gold-dark", desc: "10,000豆起" },
  { level: "👑 冠名赞助", min: 50000, color: "bg-brand-teal/10 text-brand-teal-dark", desc: "50,000豆起" },
];

const CHARITY_RESULTS = [
  { icon: "📚", count: 3, label: "乡村小学图书角", color: "bg-brand-coral/10 text-brand-coral" },
  { icon: "🌊", count: 2, label: "环保项目", color: "bg-brand-teal/10 text-brand-teal-dark" },
  { icon: "🏥", count: 1, label: "医疗援助", color: "bg-brand-gold/10 text-brand-amber-600" },
  { icon: "🐾", count: 3, label: "动物保护", color: "bg-purple-500/10 text-purple-600" },
];

const VOTE_KEY = "charity_vote";

export default function CharityFundPage() {
  const { user } = useAuth();
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(100);
  const [donating, setDonating] = useState(false);
  const [donateMsg, setDonateMsg] = useState("");
  const [showSponsor, setShowSponsor] = useState(false);
  const [userVote, setUserVote] = useState("");
  const [voteResult, setVoteResult] = useState("");
  const [balance, setBalance] = useState(0);
  const [showFundDetails, setShowFundDetails] = useState(false);

  // 用户本地参与的公益记录
  const [myPkCount, setMyPkCount] = useState(0);
  const [myDonations, setMyDonations] = useState(0);

  // 读取本地记录
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserVote(localStorage.getItem(VOTE_KEY) || "");
      const history = JSON.parse(localStorage.getItem("donate_history") || "[]");
      setMyDonations(history.reduce((s: number, d: any) => s + (d.amount || 0), 0));
    }
  }, []);

  // 获取真实余额
  const fetchBalance = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "balance" }),
      });
      const d = await res.json();
      if (d.code === 0) setBalance(Math.floor(d.data?.game_coins || 0));
    } catch {}
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // 投票
  const handleVote = (project: string) => {
    if (!user) return;
    localStorage.setItem(VOTE_KEY, project);
    setUserVote(project);
    setVoteResult(`✅ 你已投票支持「${CHARITY_PROJECTS.find(p => p.value === project)?.label || project}」`);
    setTimeout(() => setVoteResult(""), 3000);
  };

  // 捐赠（真实扣credit1豆）
  const handleDonate = async () => {
    if (!user?.uid) { setDonateMsg("请先登录"); return; }
    if (donateAmount < 10) { setDonateMsg("最低捐赠10豆"); return; }
    if (donateAmount > balance) { setDonateMsg(`余额不足！仅 ${balance.toLocaleString()}🎮`); return; }

    setDonating(true);
    setDonateMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          action: "bet",
          amount: donateAmount,
          lottery: "charity_donate",
        }),
      });
      const d = await res.json();
      if (d.code !== 0) { setDonateMsg(d.msg || "捐赠失败"); setDonating(false); return; }

      // 本地记录
      const history = JSON.parse(localStorage.getItem("donate_history") || "[]");
      history.push({ amount: donateAmount, time: Date.now() });
      localStorage.setItem("donate_history", JSON.stringify(history));

      setDonateMsg(`✅ 感谢你捐赠 ${donateAmount.toLocaleString()} 🎮！`);
      setMyDonations(prev => prev + donateAmount);
      setShowDonate(false);
      await fetchBalance();
    } catch {
      setDonateMsg("网络错误，捐赠失败");
    }
    setDonating(false);
  };

  return (
    <main className="pb-24 bg-bg min-h-screen">
      {/* ① 品牌色Header（品牌双色渐变，去紫色） */}
      <div className="bg-gradient-to-br from-brand-coral via-brand-coral-dark to-brand-teal-dark px-5 pt-10 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-white/60 text-[11px] hover:text-white transition-colors">&larr; 返回</Link>
        </div>
        <div className="text-center mt-2">
          <div className="text-[28px] mb-1">❤️</div>
          <div className="text-[18px] font-bold text-white">公益资金池</div>
          <div className="text-[11px] text-white/80 mt-1">你的每一次PK、每一份捐赠，都在让世界变好</div>
        </div>
      </div>

      {/* ② 我的贡献（新！个人看板） */}
      {user && (
        <div className="-mt-5 mx-4">
          <div className="bg-surface rounded-[14px] shadow-sm border border-border-tertiary p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-brand-coral" />
              <span className="text-sm font-semibold text-text-primary">我的公益贡献</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary">PK参与</div>
                <div className="text-base font-bold text-brand-coral">{myPkCount}次</div>
              </div>
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary">已捐赠</div>
                <div className="text-base font-bold text-brand-teal-dark">{myDonations.toLocaleString()}🎮</div>
              </div>
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary">公益值</div>
                <div className="text-base font-bold text-brand-gold-dark">{myPkCount * 100 + myDonations}</div>
              </div>
            </div>
            {/* 进度条 */}
            <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
              <span>🏅 Lv.1 公益新星</span>
              <span>{myPkCount * 100 + myDonations}/1,000 → Lv.2</span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-coral to-brand-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((myPkCount * 100 + myDonations) / 1000) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-text-tertiary mt-2 text-center">
              参与PK或捐赠可提升公益等级
            </div>
          </div>
        </div>
      )}

      {/* ③ 资金池总览（紧凑版） */}
      <div className="mx-4 mt-3">
        <div className="bg-surface rounded-[12px] shadow-sm border border-border-tertiary p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-tertiary">公益资金池总额</span>
            <span className="text-[10px] text-text-tertiary">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              本月 +{FUND_METRICS.monthly_inflow.toLocaleString()}
            </span>
          </div>
          <div className="text-[26px] font-bold text-brand-coral mt-0.5">
            {FUND_METRICS.total_fund.toLocaleString()}
            <span className="text-[13px] text-text-tertiary ml-1 font-normal">🎮</span>
          </div>

          {/* 来源构成 */}
          <div className="mt-3 space-y-2">
            {FUND_SOURCES.map((src, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-text-secondary">{src.label}</span>
                  <span className="text-[10px] text-text-secondary">{src.pct}%</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${src.color}`} style={{ width: `${src.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* 4个快指标（可折叠） */}
          <button onClick={() => setShowFundDetails(!showFundDetails)}
            className="w-full flex items-center justify-center gap-1 mt-2 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors">
            {showFundDetails ? "收起" : "查看详情"}
            {showFundDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showFundDetails && (
            <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border-tertiary">
              {[
                { label: "捐赠人数", val: FUND_METRICS.total_donors },
                { label: "赞助企业", val: FUND_METRICS.total_sponsors },
                { label: "资助项目", val: FUND_METRICS.projects_funded },
                { label: "参与PK", val: "2,184" },
              ].map((d, i) => (
                <div key={i} className="text-center">
                  <div className="text-[13px] font-semibold text-text-primary">{d.val}</div>
                  <div className="text-[8px] text-text-tertiary">{d.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ④ 公益PK入口（强化CTA） */}
      <div className="mx-4 mt-3">
        <Link href="/pk-hall"
          className="block bg-surface rounded-[12px] shadow-sm border border-border-tertiary p-4 active:scale-[0.98] transition-all hover:border-brand-coral/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-brand-coral/10 flex items-center justify-center text-[20px]">⚔️</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-text-primary">发起公益PK</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">
                输家<span className="text-brand-coral font-bold">80%</span>自动捐赠 · 你PK=做公益
              </div>
            </div>
            <div className="bg-gradient-to-r from-brand-coral to-brand-gold text-white text-[10px] px-3 py-1.5 rounded-[6px] font-bold">
              去PK大厅
            </div>
          </div>
        </Link>
      </div>

      {/* ⑤ 投票决定去向 */}
      <div className="mx-4 mt-3">
        <div className="bg-surface rounded-[12px] shadow-sm border border-border-tertiary p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-semibold text-text-primary">你来决定：资金分配</span>
            </div>
            <span className="text-[10px] text-text-tertiary">每月投票一次</span>
          </div>
          <div className="text-[10px] text-text-tertiary mb-3">投票决定下个月公益资金流向哪个项目：</div>
          <div className="space-y-2">
            {CHARITY_PROJECTS.map((proj) => {
              const idx = CHARITY_PROJECTS.indexOf(proj);
              const isVoted = userVote === proj.value;
              const votePct = [32, 28, 18, 14, 8][idx];
              const colors = [
                "border-brand-coral/30 bg-brand-coral/5",
                "border-brand-teal/30 bg-brand-teal/5",
                "border-brand-gold/30 bg-brand-gold/5",
                "border-purple-300/30 bg-purple-500/5",
                "border-amber-300/30 bg-amber-500/5",
              ];
              return (
                <button key={proj.value}
                  onClick={() => handleVote(proj.value)}
                  disabled={!!userVote}
                  className={`w-full flex items-center gap-3 p-3 rounded-[10px] text-left transition-all border ${
                    isVoted
                      ? "bg-brand-coral/10 border-brand-coral/30"
                      : userVote
                      ? "bg-bg border-border-tertiary opacity-50"
                      : `${colors[idx]} hover:bg-brand-coral/5`
                  }`}
                  aria-label={`投票给${proj.label}`}>
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[14px] shadow-sm border border-border-tertiary">
                    {proj.label.split(" ")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-text-primary">{proj.label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isVoted ? "bg-brand-coral" : "bg-border-tertiary"}`}
                          style={{ width: `${votePct}%` }} />
                      </div>
                      <span className="text-[10px] text-text-tertiary">{votePct}%</span>
                    </div>
                  </div>
                  {isVoted ? (
                    <span className="text-[11px] text-brand-coral font-medium">✅ 已投票</span>
                  ) : !userVote ? (
                    <span className="text-[11px] text-text-secondary">投票</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {voteResult && (
            <div className="mt-3 text-center text-[11px] text-brand-coral font-medium bg-brand-coral/5 rounded-[8px] py-2">
              {voteResult}
            </div>
          )}
        </div>
      </div>

      {/* ⑥ 捐赠/赞助（合并紧凑） */}
      <div className="mx-4 mt-3">
        <div className="bg-surface rounded-[12px] shadow-sm border border-border-tertiary p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-semibold text-text-primary">捐赠 · 赞助</span>
            </div>
          </div>

          {/* 余额显示 */}
          {user && (
            <div className="flex items-center justify-between bg-bg rounded-[8px] px-3 py-2 mb-3">
              <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                <Coins className="w-3 h-3" /> 可用余额
              </span>
              <span className="text-[12px] font-bold text-brand-teal-dark">{balance.toLocaleString()} 🎮</span>
              <button onClick={fetchBalance} className="text-text-tertiary p-0.5 hover:text-brand-teal transition-colors">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* 快速捐赠 */}
          {!showDonate && (
            <>
              <div className="flex gap-2 mb-3">
                {[100, 500, 1000, 5000].map(amt => (
                  <button key={amt}
                    onClick={() => { if (!user) { setDonateMsg("请先登录"); return; } setDonateAmount(amt); setShowDonate(true); }}
                    className="flex-1 py-2 bg-bg rounded-[8px] text-[10px] text-text-secondary font-medium hover:bg-brand-coral/5 hover:text-brand-coral transition-all active:scale-95 border border-border-tertiary"
                    aria-label={`捐赠${amt.toLocaleString()}豆`}>
                    {amt.toLocaleString()}豆
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (!user) { setDonateMsg("请先登录"); return; } setShowDonate(true); }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white rounded-[8px] text-[11px] font-semibold active:scale-[0.97] transition-all shadow-sm">
                  💝 自定义捐赠
                </button>
                <button onClick={() => setShowSponsor(!showSponsor)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-gold to-amber-500 text-white rounded-[8px] text-[11px] font-semibold active:scale-[0.97] transition-all shadow-sm">
                  🏢 企业赞助
                </button>
              </div>
            </>
          )}

          {/* 捐赠表单 */}
          {showDonate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-secondary">捐赠豆数</span>
                <input type="number" value={donateAmount}
                  onChange={e => setDonateAmount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="flex-1 px-3 py-2 bg-bg rounded-[8px] text-[13px] text-center outline-none focus:ring-2 focus:ring-brand-coral/30 border border-border-tertiary"
                  min={10} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowDonate(false); setDonateMsg(""); }}
                  className="flex-1 py-2.5 bg-bg text-text-secondary rounded-[8px] text-[11px] font-medium active:scale-95 transition-all border border-border-tertiary"
                  aria-label="取消捐赠">取消</button>
                <button onClick={handleDonate} disabled={donating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white rounded-[8px] text-[11px] font-semibold disabled:opacity-40 active:scale-[0.97] transition-all shadow-sm"
                  aria-label="确认捐赠">
                  {donating ? "捐赠中..." : `确认捐赠 ${donateAmount.toLocaleString()}🎮`}
                </button>
              </div>
            </div>
          )}

          {/* 消息 */}
          {donateMsg && (
            <div className={`mt-3 text-center text-[11px] font-medium rounded-[8px] py-2 ${
              donateMsg.includes("✅") ? "bg-brand-teal/5 text-brand-teal-dark" : "bg-brand-coral/5 text-brand-coral"
            }`}>
              {donateMsg}
            </div>
          )}

          {/* 赞助等级（折叠） */}
          {showSponsor && (
            <div className="mt-3 pt-3 border-t border-border-tertiary">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {SPONSOR_LEVELS.map((sp, i) => (
                  <div key={i} className={`rounded-[10px] p-2.5 text-center ${sp.color} border border-border-tertiary`}>
                    <div className="text-[10px] font-semibold">{sp.level}</div>
                    <div className="text-[8px] mt-1 opacity-70">{sp.desc}</div>
                  </div>
                ))}
              </div>
              <div className="bg-bg rounded-[10px] p-3 text-center">
                <div className="text-[11px] text-text-secondary font-medium">📧 联系合作</div>
                <div className="text-[10px] text-text-tertiary mt-1">请添加企业微信洽谈赞助</div>
                <button onClick={() => { navigator.clipboard.writeText("xiaozhangyu_cs"); setDonateMsg("✅ 微信号已复制"); setTimeout(() => setDonateMsg(""), 2000); }}
                  className="mt-2 text-[10px] text-brand-coral underline"
                  aria-label="复制企业微信">复制微信号</button>
              </div>
            </div>
          )}

          {/* 最近捐赠 */}
          <div className="mt-3 pt-3 border-t border-border-tertiary">
            <div className="flex items-center gap-1 text-[11px] text-text-secondary mb-2">
              <Users className="w-3 h-3" />
              <span>最近捐赠/赞助</span>
            </div>
            <div className="space-y-2">
              {RECENT_DONATIONS.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={d.type === "赞助" ? "text-brand-gold-dark" : "text-brand-coral"}>
                      {d.type === "赞助" ? "🏢" : "👤"}
                    </span>
                    <span className="text-text-secondary">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">+{d.amount.toLocaleString()}🎮</span>
                    <span className="text-text-tertiary">{d.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ⑦ 公益成果+透明流水 */}
      <div className="mx-4 mt-3 mb-6">
        <div className="bg-surface rounded-[12px] shadow-sm border border-border-tertiary p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold text-text-primary">公益成果</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {CHARITY_RESULTS.map((r, i) => (
              <div key={i} className="bg-bg rounded-[10px] p-3 text-center border border-border-tertiary">
                <div className="text-[16px]">{r.icon}</div>
                <div className={`text-[16px] font-bold mt-1 ${r.color}`}>{r.count}</div>
                <div className="text-[9px] text-text-tertiary">{r.label}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/charity-fund/report"
              className="inline-block text-[10px] text-brand-teal-dark font-medium underline hover:text-brand-teal transition-colors">
              查看完整财务报告 →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-text-tertiary pb-4 px-4">
        每笔资金流向公开透明 · 已累计资助 {FUND_METRICS.projects_funded} 个公益项目
      </div>
    </main>
  );
}
