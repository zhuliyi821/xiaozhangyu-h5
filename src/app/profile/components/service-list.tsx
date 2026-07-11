"use client";

/** 📋 服务列表：资产中心 / 社区动态 / 收藏 / 商户管理 / 设置 */
interface Props {
  isLoggedIn: boolean;
  isMerchant: boolean;
  onLogin: () => void;
}

const MENU_ITEMS = [
  { icon: "🏆", label: "排行榜", href: "/rank", desc: "预测高手排名" },
  { icon: "🎫", label: "赛季通行证", href: "/pass", desc: "S1 · 盛夏启航" },
  { icon: "🏟️", label: "PK 排行", href: "/pk-rank", desc: "段位与胜率排行" },
  { icon: "⚔️", label: "战队中心", href: "/team", desc: "组队PK赢奖励" },
  { icon: "📦", label: "资产中心", href: "/assets", desc: "全部资产明细与兑换" },
  { icon: "🏅", label: "成就墙", href: "/achievements", desc: "9/19 成就已解锁" },
  { icon: "💬", label: "社区动态", href: "/feed", desc: "分享与发现" },
  { icon: "❤️", label: "我的收藏", href: "/favorites", desc: "收藏的商品" },
  { icon: "⚙️", label: "设置", href: "/settings", desc: "个人资料与账户" },
] as const;

const MERCHANT_ITEM = { icon: "🏪", label: "商户管理", href: "/merchant", desc: "商品 · 订单 · 员工" };

export default function ServiceList({ isLoggedIn, isMerchant, onLogin }: Props) {
  const handleClick = (href: string) => {
    if (!isLoggedIn) { onLogin(); return; }
    window.location.href = href;
  };

  return (
    <div className="mt-4 px-4 space-y-2">
      {/* 主菜单 */}
      {MENU_ITEMS.map((item, i) => (
        <div
          key={i}
          onClick={() => handleClick(item.href)}
          className={`flex items-center gap-3 bg-white rounded-[10px] py-3.5 px-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer ${
            !isLoggedIn ? 'opacity-50' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-lg">{item.icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-text-primary">{item.label}</div>
            <div className="text-[10px] text-text-tertiary">{item.desc}</div>
          </div>
          <span className="text-text-tertiary text-sm">&gt;</span>
        </div>
      ))}

      {/* 商户管理（条件） */}
      {isLoggedIn && isMerchant && (
        <div
          onClick={() => window.location.href = MERCHANT_ITEM.href}
          className="flex items-center gap-3 bg-gradient-to-r from-brand-coral/5 to-brand-coral/10 rounded-[10px] py-3.5 px-4 shadow-sm border border-brand-coral/15 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="w-9 h-9 rounded-[10px] bg-brand-coral/10 flex items-center justify-center text-lg">{MERCHANT_ITEM.icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-brand-coral-dark">{MERCHANT_ITEM.label}</div>
            <div className="text-[10px] text-brand-coral/60">{MERCHANT_ITEM.desc}</div>
          </div>
          <span className="text-brand-coral/50 text-sm">&gt;</span>
        </div>
      )}
    </div>
  );
}
