"use client";

import { useRouter } from "next/navigation";

/**
 * 🔮 预测模板
 *
 * 通用预测/投票/竞猜类页面模板，支持排行榜、AI娱乐预测、PK对战三大模块
 * 可配置方向类别、PK方式、排行榜数据源
 */

export interface PredictConfig {
  title: string;
  subtitle: string;
  leaderboard: Array<{
    rank: number;
    name: string;
    avatar: string;
    stats: string;
    accuracy: string;
    isCrown?: boolean;
  }>;
  aiSilly: Array<{
    icon: string;
    name: string;
    desc: string;
    accentColor: string;
  }>;
  simGames: Array<{
    icon: string;
    name: string;
    desc: string;
    accentColor: string;
  }>;
  pkDirections: Array<{
    icon: string;
    name: string;
    count: string;
    color: string;
  }>;
  pkModes: Array<{
    icon: string;
    name: string;
    desc: string;
    highlight?: boolean;
  }>;
}

export interface PredictTemplateProps {
  config?: Partial<PredictConfig>;
  lotteryPrediction?: { top5: number[]; top3Back?: number[]; score: number } | null;
}

const defaultConfig: PredictConfig = {
  title: "小章鱼 · AI趣预测",
  subtitle: "AI驱动 · 全民预测 · 有奖PK",
  leaderboard: [
    { rank: 1, name: "涨停达人", avatar: "牛", stats: "预测128场·命中89场", accuracy: "69.5%", isCrown: true },
    { rank: 2, name: "神算子", avatar: "鹰", stats: "预测96场·命中62场", accuracy: "64.6%" },
    { rank: 3, name: "预言家", avatar: "虎", stats: "预测72场·命中45场", accuracy: "62.5%" },
  ],
  aiSilly: [
    { icon: "🎱", name: "彩票乱说", desc: "AI随机生成·纯属娱乐", accentColor: "rgba(242,113,82,0.1)" },
    { icon: "📈", name: "股市瞎猜", desc: "AI盲猜涨跌·不准别打", accentColor: "rgba(69,204,213,0.1)" },
    { icon: "₿", name: "BTC胡判", desc: "AI胡说走势·纯随机", accentColor: "rgba(139,92,246,0.1)" },
  ],
  simGames: [
    { icon: "🎱", name: "彩票试玩", desc: "大乐透·双色球", accentColor: "rgba(242,182,49,0.1)" },
    { icon: "₿", name: "BTC试玩", desc: "看涨·跌·大小", accentColor: "rgba(69,204,213,0.1)" },
    { icon: "📊", name: "股指试玩", desc: "沪深300模拟", accentColor: "rgba(242,113,82,0.1)" },
  ],
  pkDirections: [
    { icon: "⚽", name: "体育赛事", count: "12场进行中", color: "from-brand-coral to-brand-coral-dark" },
    { icon: "🌐", name: "社会热点", count: "8场进行中", color: "from-brand-teal to-brand-teal-dark" },
    { icon: "⚡", name: "突发事件", count: "3场进行中", color: "from-brand-gold to-brand-gold-dark" },
    { icon: "💬", name: "一言不合", count: "自由发起", color: "from-purple-400 to-purple-600" },
  ],
  pkModes: [
    { icon: "⚔️", name: "1:1", desc: "单人PK" },
    { icon: "🛡️", name: "1对多", desc: "挑战群雄" },
    { icon: "🏰", name: "多对多", desc: "团队对决" },
    { icon: "💰", name: "发起有奖", desc: "设奖邀战", highlight: true },
  ],
};

export default function PredictTemplate({ config: userConfig, lotteryPrediction }: PredictTemplateProps) {
  const cfg = { ...defaultConfig, ...userConfig, leaderboard: userConfig?.leaderboard || defaultConfig.leaderboard };
  const router = useRouter();

  return (
    <main className="pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-gold px-6 pt-8 pb-7 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <h1 className="text-2xl font-bold text-white relative z-10">{cfg.title}</h1>
        <p className="text-sm text-white/85 mt-1.5 relative z-10">{cfg.subtitle}</p>
      </div>

      {/* Leaderboard */}
      <SectionTitle title="预测排行榜" link="完整榜单" />
      <div className="grid grid-cols-7 gap-2 px-4 items-stretch">
        {/* 鹰 (左) - 2/7 小方型 */}
        <div className="col-span-2 bg-surface rounded-[20px] py-2.5 px-2 text-center shadow-sm border border-[rgba(69,204,213,0.08)] flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-text-tertiary">2</span>
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-sm mx-auto my-0.5">
            鹰
          </div>
          <div className="text-[10px] font-semibold">神算子</div>
          <div className="text-[9px] font-bold text-brand-coral mt-0.5">64.6%</div>
        </div>

        {/* 牛 (中) - 3/7 */}
        <div className="col-span-3 bg-surface rounded-[20px] py-4 px-3 text-center shadow-sm border border-brand-gold bg-gradient-to-b from-[rgba(242,182,49,0.08)] to-surface flex flex-col items-center justify-center">
          <span className="text-lg block -mt-1">👑</span>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center text-lg mx-auto my-1">
            牛
          </div>
          <div className="text-xs font-semibold">涨停达人</div>
          <div className="text-[9px] text-text-tertiary mt-0.5">预测128场·命中89场</div>
          <div className="text-base font-bold text-brand-gold-dark mt-0.5">69.5%</div>
        </div>

        {/* 虎 (右) - 2/7 小方型 */}
        <div className="col-span-2 bg-surface rounded-[20px] py-2.5 px-2 text-center shadow-sm border border-[rgba(69,204,213,0.08)] flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-text-tertiary">3</span>
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-sm mx-auto my-0.5">
            虎
          </div>
          <div className="text-[10px] font-semibold">预言家</div>
          <div className="text-[9px] font-bold text-brand-coral mt-0.5">62.5%</div>
        </div>
      </div>

      {/* AI 瞎测 */}
      <SectionTitle title="AI瞎测" link="娱乐为主·勿当真" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.aiSilly.map((c, i) => {
          const isLottery = c.name === "彩票乱说";
          const isStock = c.name === "股市瞎猜";
          const isBTC = c.name === "BTC胡判";
          return (
          <div key={i}
            onClick={() => {
              if (isLottery) {
                // Pass prediction numbers to lottery-sim
                const pred = lotteryPrediction;
                if (pred && pred.top5) {
                  const frontStr = pred.top5.slice(0,5).join(",");
                  const backStr = pred.top3Back ? pred.top3Back.slice(0,2).join(",") : "";
                  router.push(`/lottery-sim?type=dlt&pred=${frontStr}-${backStr}`);
                } else {
                  router.push("/lottery-sim");
                }
              }
              else if (isStock) router.push("/stock-analysis");
              else if (isBTC) router.push("/btc-predict");
            }}
            className={`rounded-[20px] py-4 px-2 text-center active:scale-95 transition-transform cursor-pointer relative ${isLottery && lotteryPrediction ? 'border-2 border-brand-gold' : ''}`}
            style={{ background: c.accentColor, border: `1px solid ${c.accentColor.replace('0.1','0.2')}` }}>
            {isLottery && lotteryPrediction && (
              <div className="absolute -top-1.5 -right-1.5 bg-brand-gold text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </div>
            )}
            <span className="text-[28px] block mb-1.5">{c.icon}</span>
            <div className="text-[13px] font-semibold">{c.name}</div>
            {isLottery && lotteryPrediction ? (
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-center gap-0.5">
                  {lotteryPrediction.top5.slice(0, 5).map(n => (
                    <span key={n} className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white flex items-center justify-center text-[9px] font-bold">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                {lotteryPrediction.top3Back && (
                  <div className="flex justify-center gap-0.5">
                    {lotteryPrediction.top3Back.slice(0, 2).map(n => (
                      <span key={n} className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white flex items-center justify-center text-[8px] font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[8px] text-text-tertiary">AI置信度 {lotteryPrediction.score}%</div>
              </div>
            ) : (
              <div className="text-[10px] text-text-tertiary mt-0.5 leading-tight">{c.desc}</div>
            )}
          </div>
          );
        })}
      </div>

      {/* 模拟试玩 */}
      <SectionTitle title="模拟试玩" link="" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.simGames.map((g, i) => (
          <div key={i}
            onClick={() => {
              if (g.name === "BTC试玩") router.push("/btc");
              else if (g.name === "股指试玩") router.push("/sim");
              else router.push("/lottery-sim");
            }}
            className="rounded-[20px] py-4 px-2 text-center active:scale-95 transition-transform cursor-pointer"
            style={{ background: g.accentColor, border: `1px solid ${g.accentColor.replace('0.1','0.2')}` }}>
            <span className="text-[28px] block mb-1.5">{g.icon}</span>
            <div className="text-[13px] font-semibold">{g.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 leading-tight">{g.desc}</div>
          </div>
        ))}
      </div>

      {/* PK Directions */}
      <SectionTitle title="⚔️ 预测方向PK" link="发起有奖 PK →" />
      <div className="grid grid-cols-4 gap-1.5 px-4 mb-2">
        {cfg.pkDirections.map((d, i) => (
          <div key={i} className="bg-surface rounded-[16px] py-3 px-1.5 text-center shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-93 transition-transform cursor-pointer">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${d.color} flex items-center justify-center mx-auto mb-1`}>
              <span className="text-base">{d.icon}</span>
            </div>
            <div className="text-[11px] font-semibold">{d.name}</div>
            <div className="text-[9px] text-text-tertiary mt-0.5">{d.count}</div>
          </div>
        ))}
      </div>

      {/* PK Modes */}
      <div className="mx-4 bg-surface rounded-[20px] p-3 shadow-sm border border-[rgba(69,204,213,0.08)] mb-2">
        <div className="text-[11px] font-semibold text-text-secondary mb-2.5 px-0.5">PK方式</div>
        <div className="grid grid-cols-4 gap-2">
          {cfg.pkModes.map((m, i) => (
            <button key={i} className={`rounded-[12px] py-2.5 px-1 text-center active:scale-93 transition-transform relative overflow-hidden ${m.highlight?'bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white shadow-[0_2px_8px_rgba(242,182,49,0.25)]':'bg-bg'}`}
              onClick={m.highlight ? () => {
                // Show reward rules modal
                showRewardRules();
              } : undefined}>
              <div className="text-lg mb-0.5">{m.icon}</div>
              <div className="text-[11px] font-semibold">{m.name}</div>
              <div className={`text-[9px] mt-0.5 ${m.highlight?'text-white/80':'text-text-tertiary'}`}>{m.desc}</div>
              {m.highlight && <span className="absolute -top-1 -right-1 text-[8px] px-1 bg-white/20 rounded">🏆</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Active PK Matches */}
      {[
        { emoji: "⚽", dir: "体育", mode: "1:1", pool: "500", challenger: "涨停达人", opponent: "神算子", optA: "🇫🇷 法国胜", optB: "🇭🇷 克罗地亚胜", time: "2h 15min" },
        { emoji: "🌐", dir: "社会", mode: "1对多", pool: "1000", challenger: "预言家", opponent: "8人应战", optA: "🤖 AI取代30%岗位", optB: "💪 不会取代", time: "1d 8h" },
        { emoji: "💬", dir: "一言不合", mode: "多对多", pool: "2000", challenger: "🍉 甜粽党", opponent: "🧊 咸粽党", optA: "🔥 甜粽子好吃", optB: "🧂 咸粽子YYDS", time: "6d 12h" },
      ].map((p, i) => (
        <div key={i} className="mx-4 mb-2 bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-[0.98] transition-transform cursor-pointer">
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-2">
            <span>{p.emoji} {p.dir}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
            <span>⚔️ {p.mode}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary" />
            <span>奖池 {p.pool}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium mb-2">
            <span className="text-brand-coral font-semibold">{p.challenger}</span>
            <span className="text-text-tertiary">VS</span>
            <span className="text-brand-teal-dark font-semibold">{p.opponent}</span>
          </div>
          <div className="flex gap-1.5 mb-2">
            <span className="flex-1 bg-bg rounded-[10px] py-2 text-center text-[11px] active:scale-[0.97] transition-transform cursor-pointer border border-transparent hover:border-brand-gold">{p.optA}</span>
            <span className="flex-1 bg-bg rounded-[10px] py-2 text-center text-[11px] active:scale-[0.97] transition-transform cursor-pointer border border-transparent hover:border-brand-gold">{p.optB}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-tertiary">距截止: {p.time}</span>
            <span className="text-[11px] font-semibold text-brand-coral">⚡ 参与竞猜</span>
          </div>
        </div>
      ))}

      <div className="px-4 mt-3">
        <button onClick={() => showRewardRules()} className="w-full bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white py-3.5 rounded-[20px] text-sm font-semibold shadow-[0_4px_16px_rgba(242,182,49,0.3)] active:scale-[0.97] transition-transform">
          💰 发起有奖PK
        </button>
        <div className="text-center text-[9px] text-text-tertiary mt-1.5">最低 100 游戏豆 · 上不封顶</div>
      </div>
    </main>
  );
}

function SectionTitle({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
      <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-gold to-brand-coral">
        {title}
      </h2>
      {link && <span className="text-xs text-brand-teal-dark font-medium">{link}</span>}
    </div>
  );
}

function showRewardRules() {
  alert(
    "💰 预测奖励规则\n\n" +
    "🎯 如何参与PK：\n" +
    "① 选择PK方向\n" +
    "② 选择PK方式\n" +
    "③ 设定奖池（最低100游戏豆）\n" +
    "④ 发出挑战\n\n" +
    "🏆 奖励计算：\n" +
    "• 输家消耗的游戏豆 = 平台奖励的豆豆\n" +
    "• 80% 按投票比例分配\n" +
    "• 20% 入全网统一奖励池\n\n" +
    "⚔️ 1:1 → A投200 vs B投200 → A胜\n" +
    "  A收回200游戏豆 + 奖励160豆豆(80%归A)\n\n" +
    "🛡️ 1对多 → A投300 vs B(200)+C(100)\n" +
    "  B、C胜：B收200+C收100游戏豆\n" +
    "  奖励240豆豆(80%)按2:1分: B160 C80\n" +
    "  60豆豆(20%)入全网池"
  );
}
