import Link from "next/link";
import { Target, TrendingUp, Scan, MapPin, Calculator, Sparkles } from "lucide-react";

const items = [
  { icon: TrendingUp, label: "AI走势", sub: "图表+选号", href: "/lottery/dlt/chart" },
  { icon: Target, label: "开奖查询", sub: "实时更新", href: "/draw" },
  { icon: Sparkles, label: "周易运势", sub: "八字推演", href: "/fortune" },
  { icon: Scan, label: "扫码验奖", sub: "秒查结果", href: "/scan" },
  { icon: MapPin, label: "门店服务", sub: "优选兑换", href: "/store-services" },
  { icon: Calculator, label: "计算器", sub: "复式/胆拖", href: "/calculator" },
];

export function NewsGrid() {
  return (
    <section className="mt-4 px-4">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-gold to-brand-coral">
          机会快讯
        </h2>
        <span className="text-xs text-brand-teal-dark font-medium">更多</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="bg-surface rounded-[20px] px-2 py-3.5 text-center shadow-[0_2px_12px_rgba(69,204,213,0.06)] border border-[rgba(69,204,213,0.08)] relative overflow-hidden active:scale-95 transition-transform cursor-pointer block"
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[3px]"
              style={{
                background:
                  i % 3 === 0
                    ? "linear-gradient(90deg, #F2B631, #F27152)"
                    : i % 3 === 1
                    ? "linear-gradient(90deg, var(--color-brand-teal), #F2B631)"
                    : "linear-gradient(90deg, #F27152, #F2B631)",
              }}
            />
            <item.icon className="w-6 h-6 mx-auto mb-1.5 text-brand-teal-dark" />
            <div className="text-[12px] font-medium">{item.label}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
