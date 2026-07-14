import Link from "next/link";

const actions = [
  { label: "今日任务", icon: "📋", href: "/tasks", bg: "bg-[#EEEDFE]", color: "text-[#3C3489]" },
  { label: "开奖查询", icon: "🎫", href: "/draw", bg: "bg-gray-50", color: "text-text-secondary" },
  { label: "我的ai", icon: "🦞", href: "/agent", bg: "bg-brand-teal-light/20", color: "text-brand-teal-dark" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((item, i) => (
        <Link key={i} href={item.href}
          className="bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] py-3 text-center active:scale-[0.97] transition-transform">
          <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center mx-auto mb-1.5 text-[18px]`}>
            {item.icon}
          </div>
          <div className={`text-[12px] font-medium ${item.color}`}>{item.label}</div>
        </Link>
      ))}
    </div>
  );
}
