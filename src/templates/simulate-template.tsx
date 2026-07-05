"use client";

/**
 * 🎮 模拟模板
 *
 * 通用模拟/试玩/游戏页面模板
 * 支持资产展示、模拟游戏列表、PK赛事三大模块
 */

export interface SimAsset {
  icon: string;
  label: string;
  value: string;
  color: string;
}

export interface SimGame {
  icon: string;
  name: string;
  desc: string;
  accentColor?: string;
}

export interface PkEvent {
  emoji: string;
  name: string;
  badge: string;
  badgeColor?: string;
  meta: string;
  action: string;
}

export interface SimulateConfig {
  assets: SimAsset[];
  games: SimGame[];
  pkEvents: PkEvent[];
  title: string;
}

export interface SimulateTemplateProps {
  config?: Partial<SimulateConfig>;
}

const defaultConfig: SimulateConfig = {
  title: "模拟中心",
  assets: [
    { icon: "🎮", label: "游戏豆", value: "2,680", color: "text-brand-gold-dark" },
    { icon: "⛏️", label: "水晶石", value: "1,200", color: "text-amber-600" },
    { icon: "🔮", label: "水晶球", value: "5", color: "text-purple-600" },
  ],
  games: [
    { icon: "🎱", name: "彩票试玩", desc: "大乐透·双色球", accentColor: "from-brand-gold to-brand-coral" },
    { icon: "₿", name: "BTC试玩", desc: "看涨/跌/大小", accentColor: "from-brand-teal to-brand-gold" },
    { icon: "📊", name: "股指试玩", desc: "沪深300", accentColor: "from-brand-coral to-brand-teal" },
  ],
  pkEvents: [
    { emoji: "⚔️", name: "选号大神PK赛", badge: "进行中", meta: "参赛128人 · 奖池10,000游戏豆", action: "参赛" },
    { emoji: "📈", name: "BTC猜涨跌", badge: "即将开始", badgeColor: "bg-brand-teal", meta: "参赛56人 · 奖池3,000游戏豆", action: "报名" },
    { emoji: "🏅", name: "水晶球争霸赛", badge: "报名中", badgeColor: "bg-brand-teal-dark", meta: "参赛32人 · 奖池2,000游戏豆", action: "报名" },
  ],
};

export default function SimulateTemplate({ config: userConfig }: SimulateTemplateProps) {
  const cfg = { ...defaultConfig, ...userConfig };

  return (
    <main className="pb-20">
      <SectionTitle title={cfg.title} link="排行榜" />

      {/* Assets */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.assets.map((a, i) => (
          <div key={i} className="bg-gradient-to-br from-surface to-[#f8fafa] rounded-[28px] py-4 px-3 text-center shadow-[0_2px_12px_rgba(69,204,213,0.08)] border border-[rgba(69,204,213,0.1)]">
            <span className="text-[28px] block mb-1">{a.icon}</span>
            <div className="text-[11px] text-text-secondary mb-0.5">{a.label}</div>
            <div className={`text-xl font-bold ${a.color}`}>{a.value}</div>
          </div>
        ))}
      </div>

      {/* Sim Games */}
      <SectionTitle title="模拟游戏" link="" />
      <div className="grid grid-cols-3 gap-2 px-4">
        {cfg.games.map((g, i) => (
          <div key={i} className="bg-surface rounded-[20px] py-4 px-2 text-center shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${g.accentColor}`} />
            <span className="text-[30px] block mb-1.5">{g.icon}</span>
            <div className="text-[13px] font-semibold">{g.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{g.desc}</div>
          </div>
        ))}
      </div>

      {/* PK Events */}
      <SectionTitle title="PK 赛" link="全部赛事" />
      {cfg.pkEvents.map((p, i) => (
        <div key={i} className="mx-4 mb-2.5 bg-surface rounded-[20px] p-4 flex gap-3.5 items-center shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-98 transition-transform cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-teal-light to-brand-gold-light flex items-center justify-center text-xl shrink-0">
            {p.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold">
              {p.name}
              <span className={`${p.badgeColor||'bg-brand-coral'} text-white px-2 py-0.5 rounded-[10px] text-[10px] font-semibold`}>{p.badge}</span>
            </div>
            <div className="text-[11px] text-text-tertiary mt-0.5">{p.meta}</div>
          </div>
          <div className="text-xs font-semibold text-brand-gold-dark">{p.action}</div>
        </div>
      ))}
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
