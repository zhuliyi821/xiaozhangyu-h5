"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ChevronRight, Check, Shield, TrendingUp, Clock, RefreshCw, Zap, Smartphone, BarChart3, Users, Store, Bot, Image as ImageIcon } from "lucide-react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", tealDark: "#0F6E56", bg: "#F5F6FA" };

const FEATURES = [
  { icon: Bot, title: "AI智能员工", desc: "24小时在线接待·智能问答·自动回复", color: C.teal },
  { icon: Smartphone, title: "自媒体运营", desc: "公众号·小红书·抖音内容自动分发", color: C.coral },
  { icon: Store, title: "门店装修", desc: "千店千面·品牌色自定义·精美模板", color: C.gold },
  { icon: BarChart3, title: "数据分析", desc: "收入统计·客流分析·热力图·趋势预测", color: C.teal },
  { icon: Users, title: "员工管理", desc: "店员权限·工单分配·绩效追踪", color: C.coral },
  { icon: Zap, title: "引流锁客", desc: "🎁 自动引流·会员沉淀·复购唤醒", color: C.gold },
];

const COMPARISONS = [
  { before: "人工客服限时在线", after: "24h AI员工在线接待" },
  { before: "手工记账易出错", after: "自动数据报表实时更新" },
  { before: "被动等客上门", after: "AI自动引流+锁客" },
  { before: "无线上渠道", after: "多平台内容自动分发" },
  { before: "单店管理困难", after: "手机端一键管理" },
];

export default function MerchantCooperationPage() {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(f => (f + 1) % FEATURES.length), 3000);
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => { clearInterval(timer); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* ═══ Hero ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute top-1/3 left-1/4 w-20 h-20 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 px-5 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/15 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium">🏪 小章鱼商户</span>
            <span className="bg-brand-gold/30 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium">AI自动化运营</span>
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight">
            让AI成为你的
            <br />
            <span className="bg-gradient-to-r from-brand-gold to-amber-300 bg-clip-text text-transparent">金牌店长</span>
          </h1>
          <p className="text-[14px] text-white/80 mt-3 leading-relaxed max-w-[300px]">
            小章鱼商户AI自动化运营系统<br />
            门店管理 · AI员工 · 自媒体 · 引流锁客
          </p>

          {/* 3大承诺 */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Clock, value: "6个月", label: "见效周期", sub: "从开通到见效" },
              { icon: TrendingUp, value: "3倍", label: "收入增量", sub: "对比开通前" },
              { icon: Shield, value: "全额", label: "现金退款", sub: "未达标全额退" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-[12px] p-3 text-center border border-white/10">
                <item.icon className="w-5 h-5 mx-auto mb-1 text-brand-gold-light" />
                <div className="text-lg font-extrabold text-brand-gold-light">{item.value}</div>
                <div className="text-[9px] text-white/70">{item.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <a href="/merchant/apply"
              className="flex-1 py-3 rounded-[12px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[13px] font-semibold text-center active:scale-[0.97] transition-all shadow-lg shadow-brand-gold/30">
              🚀 立即开通
            </a>
            <a href="/store"
              className="flex-1 py-3 rounded-[12px] bg-white/15 backdrop-blur text-white text-[13px] font-semibold text-center active:scale-[0.97] transition-all border border-white/20">
              🗺️ 合作门店
            </a>
          </div>
        </div>
      </div>

      {/* ═══ 数据证明条 ═══ */}
      <div className="bg-white border-b border-gray-100 py-3 px-5">
        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
          <span>📊 已服务门店</span>
          <span className="font-bold text-brand-teal-dark">128家</span>
          <span className="text-gray-200">|</span>
          <span>🏆 平均营收增长</span>
          <span className="font-bold text-brand-coral-dark">+215%</span>
          <span className="text-gray-200">|</span>
          <span>⭐ 客户满意</span>
          <span className="font-bold text-brand-gold-dark">98%</span>
        </div>
      </div>

      {/* ═══ Before/After 对比 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">传统门店 → AI智慧门店</h2>
        <p className="text-[11px] text-text-tertiary mb-4">一次升级，全面蜕变</p>
        <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-red-400 mb-2">❌ 传统门店</div>
              <div className="space-y-2">
                {COMPARISONS.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-red-300 shrink-0" />
                    <span>{c.before}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-green-500 mb-2">✅ AI智慧门店</div>
              <div className="space-y-2">
                {COMPARISONS.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-green-700">
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{c.after}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 6大功能轮播 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">一站式解决方案</h2>
        <p className="text-[11px] text-text-tertiary mb-4">6大模块，覆盖门店经营全链路</p>

        {/* 当前高亮卡片 */}
        <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100 mb-3 transition-all duration-300"
          style={{ borderLeftColor: FEATURES[activeFeature].color, borderLeftWidth: 3 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: `${FEATURES[activeFeature].color}18` }}>
              {(() => {
                const Icon = FEATURES[activeFeature].icon;
                return <Icon className="w-5 h-5" style={{ color: FEATURES[activeFeature].color }} />;
              })()}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-text-primary">{FEATURES[activeFeature].title}</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">{FEATURES[activeFeature].desc}</div>
            </div>
          </div>
        </div>

        {/* 小圆点导航 */}
        <div className="flex justify-center gap-1.5 mb-4">
          {FEATURES.map((_, i) => (
            <div key={i} onClick={() => setActiveFeature(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeFeature ? "w-5 bg-brand-teal" : "w-1.5 bg-gray-200"
              }`} />
          ))}
        </div>

        {/* 功能网格 */}
        <div className="grid grid-cols-3 gap-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} onClick={() => setActiveFeature(i)}
                className={`bg-white rounded-[10px] p-3 text-center cursor-pointer transition-all active:scale-[0.97] border ${
                  i === activeFeature ? "shadow-sm" : "border-gray-50"
                }`}
                style={i === activeFeature ? { borderColor: f.color, backgroundColor: `${f.color}08` } : {}}>
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: f.color }} />
                <div className="text-[9px] font-medium text-text-secondary leading-tight">{f.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 定价卡片 ═══ */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-[16px] p-5 border-2 shadow-sm"
          style={{ borderColor: C.gold }}>
          {/* 标记 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">🔥 推荐</span>
            <span className="text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">一次性付费</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-text-primary">小章鱼商户</h3>
              <p className="text-[11px] text-amber-800 font-medium">AI自动化运营系统</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-extrabold" style={{ color: C.coral }}>¥9,800</div>
              <div className="text-[9px] text-gray-400">多种支付方式可选</div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 bg-white/80 rounded-[8px] p-2.5 border border-gray-100">
              <span className="text-base">💰</span>
              <div className="flex-1">
                <div className="text-[11px] font-medium text-text-primary">现金支付</div>
                <div className="text-[9px] text-gray-400">微信/支付宝/银行转账</div>
              </div>
              <span className="text-[10px] font-semibold text-brand-teal-dark">推荐</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-brand-gold/8 to-white rounded-[8px] p-2.5 border border-brand-gold/30">
              <span className="text-base">🔄</span>
              <div className="flex-1">
                <div className="text-[11px] font-medium text-amber-800">产品置换</div>
                <div className="text-[9px] text-amber-600">拿自己产品来换 · 最高90%产品+10%现金</div>
              </div>
              <span className="text-[9px] bg-brand-gold/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">新</span>
            </div>
          </div>

          {/* 赠送提示 */}
          <div className="mt-4 bg-gradient-to-r from-brand-gold/15 to-transparent rounded-[8px] p-3 flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <div>
              <div className="text-[11px] font-semibold text-amber-800">赠：引流锁客模块</div>
              <div className="text-[9px] text-amber-600">价值 ¥2,980 · 自动引流+会员沉淀+复购唤醒</div>
            </div>
          </div>

          {/* 退款保障 */}
          <div className="mt-3 flex items-start gap-2 bg-green-50 rounded-[8px] p-3">
            <Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-semibold text-green-700">💯 6个月保障承诺</div>
              <div className="text-[9px] text-green-600 mt-0.5">
                开通后6个月内，门店营收未达3倍增长 → <strong>全额现金退款</strong>，零风险
              </div>
            </div>
          </div>

          <a href="/merchant/apply"
            className="block mt-4 w-full py-3.5 rounded-[12px] text-center text-white text-[13px] font-bold active:scale-[0.97] transition-all shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C.gold}, #D99A0F)` }}>
            🚀 立即开通 · ¥9,800
          </a>
          <p className="text-[9px] text-gray-300 text-center mt-2">开通后自动获取商户后台权限</p>
        </div>
      </div>

      {/* ═══ 常见问题 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-3">常见问题</h2>
        <div className="space-y-2">
          {[
            { q: "没有门店也能开通吗？", a: "可以。个体工商户、线上店铺均可申请，入驻流程一致。" },
            { q: "6个月未达标怎么退款？", a: "到期后7个工作日内，提供营收对比数据，审核通过后全额原路退回。" },
            { q: "代金券怎么用？", a: "门店商品代金券可按比例抵扣系统费用，最高抵扣50%。" },
            { q: "多久能上手？", a: "开通即用，AI员工5分钟配置完成，无需专业技术背景。" },
            { q: "产品置换怎么操作？", a: "您可以用自己的门店商品/服务来置换系统费用，商品估值按市场价的90%计算，剩余部分（最高10%）用现金补齐即可。具体商品估值由平台审核后确定。" },
          ].map((faq, i) => (
            <details key={i} className="bg-white rounded-[10px] border border-gray-100">
              <summary className="px-4 py-3 text-[12px] font-medium text-text-primary cursor-pointer list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 transition-transform ui-open:rotate-90" />
              </summary>
              <div className="px-4 pb-3 text-[11px] text-text-tertiary leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* ═══ 底部CTA ═══ */}
      <div className="px-5 mt-6 pb-8">
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-[16px] p-6 text-center text-white">
          <div className="text-[18px] font-bold mb-2">开启AI智慧门店</div>
          <p className="text-[11px] text-white/80 mb-4">6个月·3倍增量·全额退款保障</p>
          <a href="/merchant/apply"
            className="inline-block px-8 py-3 rounded-[12px] bg-white text-brand-teal-dark text-[13px] font-bold active:scale-[0.97] transition-all shadow-lg">
            📝 立即申请入驻
          </a>
          <div className="mt-3 text-[10px] text-white/60">
            已有门店？<a href="/store" className="text-brand-gold-light underline">查看合作门店 →</a>
          </div>
        </div>
      </div>

      {/* 消息 */}
      <style>{`
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
