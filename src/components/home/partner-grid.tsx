import Link from "next/link";

interface PartnerItem {
  label: string;
  icon: string;
  href: string;
}

const partners: PartnerItem[] = [
  { label: "区域合伙人", icon: "📍", href: "/regional-partner" },
  { label: "门店合作", icon: "🏪", href: "/merchant/cooperation" },
  { label: "供应厂商", icon: "📦", href: "/marketplace/cooperation" },
];

/**
 * 合作条 — 水平滚动，瘦条
 */
export function PartnerGrid() {
  return (
    <div className="bg-white rounded-[12px] border border-brand-teal/10 px-4 py-2.5">
      <div className="flex gap-5 overflow-x-auto no-scrollbar">
        {partners.map((item, i) => (
          <Link key={i} href={item.href}
            className="flex items-center gap-1.5 flex-shrink-0 text-[12px] text-text-secondary hover:text-text-primary transition-colors active:scale-95">
            <span className="text-[14px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
