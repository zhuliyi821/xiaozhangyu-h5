"use client";

/** ⚡ 快捷操作：消息中心 / 我的订单 / 卡券包 */
interface Props {
  couponCount: number;
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function QuickActions({ couponCount, isLoggedIn, onLogin }: Props) {
  const actions = [
    {
      icon: "💬", label: "消息中心", sub: "系统通知与活动消息",
      href: "/messages", badge: false,
    },
    {
      icon: "📋", label: "我的活动", sub: "PK发起·围观·投注",
      href: "/activities", badge: false,
    },
    {
      icon: "🎟️", label: "卡券包", sub: couponCount > 0 ? `${couponCount}张可用` : "优惠券中心",
      href: "/coupons", badge: false,
    },
    {
      icon: "📦", label: "我的订单", sub: "查看订单状态",
      href: "/orders", badge: false,
    },
  ];

  const handleClick = (href: string) => {
    if (!isLoggedIn) { onLogin(); return; }
    window.location.href = href;
  };

  return (
    <div className="mx-4 mt-3">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a, i) => (
          <div
            key={i}
            onClick={() => handleClick(a.href)}
            className={`bg-white rounded-[10px] p-3 text-center shadow-sm border border-gray-100 active:scale-[0.96] transition-transform cursor-pointer ${
              !isLoggedIn ? 'opacity-50' : ''
            }`}
          >
            <div className="text-lg mb-0.5">{a.icon}</div>
            <div className="text-[11px] font-medium text-text-primary">{a.label}</div>
            <div className="text-[8px] text-text-tertiary mt-0.5 truncate">{a.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
