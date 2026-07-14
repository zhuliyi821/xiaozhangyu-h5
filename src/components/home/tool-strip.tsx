import Link from "next/link";

/**
 * 首页工具条 — 纯实用工具
 */
const tools = [
  { label: "开奖查询", sub: "", href: "/draw", color: "bg-gray-50", text: "text-text-secondary" },
  { label: "扫码验奖", sub: "", href: "/scan", color: "bg-gray-50", text: "text-text-secondary" },
  { label: "计算器", sub: "", href: "/calculator", color: "bg-gray-50", text: "text-text-secondary" },
];

export function ToolStrip() {
  return (
    <div className="bg-white border-t border-[rgba(69,204,213,0.08)] px-4 py-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tools.map((tool, i) => (
          <Link key={i} href={tool.href}
            className={`flex-shrink-0 rounded-[10px] px-3.5 py-2.5 text-center border ${tool.color} active:scale-95 transition-transform`}>
            <div className={`text-[12px] font-semibold ${tool.text}`}>{tool.label}</div>
            {tool.sub && <div className="text-[9px] text-text-tertiary mt-0.5">{tool.sub}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
