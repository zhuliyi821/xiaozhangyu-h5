"use client";

/** 📋 服务列表：排行 / PK / 资产 / 成就 / 商户 / 设置 */
import { useFontSize } from "@/lib/use-font-size";
interface MerchantStatus {
  isMerchant: boolean;
  paid: boolean;
  pendingPay: boolean;
  hasApply: boolean;
}

interface Props {
  isLoggedIn: boolean;
  merchantStatus: MerchantStatus;
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

export default function ServiceList({ isLoggedIn, merchantStatus, onLogin }: Props) {
  const { size, toggle, isLarge } = useFontSize();
  const handleClick = (href: string) => {
    if (!isLoggedIn) { onLogin(); return; }
    window.location.href = href;
  };

  return (
    <div className="mt-4 px-4 space-y-2">
      {/* ── 商户管理 / 申请入驻（始终显示，非商户显示申请入口）── */}
      {isLoggedIn && (
        <>
          {/* 已付费商户 → 商户管理 */}
          {merchantStatus.isMerchant && merchantStatus.paid ? (
            <div onClick={() => window.location.href = "/merchant"}
              className="flex items-center gap-3 bg-gradient-to-r from-brand-coral/5 to-brand-coral/10 rounded-[10px] py-3.5 px-4 shadow-sm border border-brand-coral/15 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-9 h-9 rounded-[10px] bg-brand-coral/10 flex items-center justify-center text-lg">🏪</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-brand-coral-dark">商户管理</div>
                <div className="text-[10px] text-brand-coral/60">商品 · 订单 · 员工 · 收入</div>
              </div>
              <span className="text-brand-coral/50 text-sm">&gt;</span>
            </div>
          ) : merchantStatus.pendingPay ? (
            /* 已通过待支付 → 去支付 */
            <div onClick={() => window.location.href = "/merchant/purchase"}
              className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-[10px] py-3.5 px-4 shadow-sm border border-amber-300 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-9 h-9 rounded-[10px] bg-amber-200/50 flex items-center justify-center text-lg">💳</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-amber-700">审核通过 · 待支付</div>
                <div className="text-[10px] text-amber-500/70">支付 ¥9,800 开通商户管理权限</div>
              </div>
              <span className="text-amber-500 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200/50">去支付</span>
            </div>
          ) : merchantStatus.hasApply ? (
            /* 已提交待审核 */
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-[10px] py-3.5 px-4 shadow-sm border border-blue-200">
              <div className="w-9 h-9 rounded-[10px] bg-blue-100 flex items-center justify-center text-lg">⏳</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-blue-700">入驻审核中</div>
                <div className="text-[10px] text-blue-400">预计1-3个工作日完成审核</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          ) : (
            /* 非商户 → 申请入驻 */
            <div onClick={() => window.location.href = "/merchant/apply"}
              className="flex items-center gap-3 bg-gradient-to-r from-brand-teal/5 to-brand-teal/10 rounded-[10px] py-3.5 px-4 shadow-sm border border-brand-teal/15 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-lg">📋</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-brand-teal-dark">申请入驻</div>
                <div className="text-[10px] text-brand-teal/60">成为商户 · 管理门店 · AI赋能</div>
              </div>
              <span className="text-brand-teal/50 text-sm">&gt;</span>
            </div>
          )}
        </>
      )}

      {/* ── 大字模式切换 ── */}
      <div onClick={toggle}
        className="flex items-center gap-3 bg-white rounded-[10px] py-3.5 px-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
        <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-lg">
          {isLarge ? "🔠" : "🔤"}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-text-primary">{isLarge ? "大字模式" : "标准模式"}</div>
          <div className="text-[10px] text-text-tertiary">{isLarge ? "当前为大字体 · 点击切换回标准" : "适合长辈的大字体 · 点击切换"}</div>
        </div>
        <div className={`w-10 h-5 rounded-full transition-colors ${isLarge ? "bg-brand-teal" : "bg-gray-200"} relative`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${isLarge ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
      </div>

      {/* ── 主菜单 ── */}
      {MENU_ITEMS.map((item, i) => (
        <div key={i} onClick={() => handleClick(item.href)}
          className={`flex items-center gap-3 bg-white rounded-[10px] py-3.5 px-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer ${!isLoggedIn ? 'opacity-50' : ''}`}>
          <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-lg">{item.icon}</div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-text-primary">{item.label}</div>
            <div className="text-[10px] text-text-tertiary">{item.desc}</div>
          </div>
          <span className="text-text-tertiary text-sm">&gt;</span>
        </div>
      ))}

      {/* ── 彩票工具（从首页迁移） ── */}
      <div className="pt-6">
        <div className="text-[12px] font-medium text-text-tertiary mb-2.5 px-0.5">🔧 实用工具</div>
        <div className="flex gap-2">
          <div onClick={() => handleClick("/draw")}
            className="flex-1 bg-gray-50 rounded-[10px] py-3 text-center border border-gray-100 active:scale-[0.97] transition-transform cursor-pointer">
            <div className="text-[18px] mb-1">🎫</div>
            <div className="text-[11px] font-medium text-text-secondary">开奖查询</div>
          </div>
          <div onClick={() => handleClick("/scan")}
            className="flex-1 bg-gray-50 rounded-[10px] py-3 text-center border border-gray-100 active:scale-[0.97] transition-transform cursor-pointer">
            <div className="text-[18px] mb-1">📷</div>
            <div className="text-[11px] font-medium text-text-secondary">扫码验奖</div>
          </div>
          <div onClick={() => handleClick("/calculator")}
            className="flex-1 bg-gray-50 rounded-[10px] py-3 text-center border border-gray-100 active:scale-[0.97] transition-transform cursor-pointer">
            <div className="text-[18px] mb-1">🧮</div>
            <div className="text-[11px] font-medium text-text-secondary">计算器</div>
          </div>
        </div>
      </div>
    </div>
  );
}
