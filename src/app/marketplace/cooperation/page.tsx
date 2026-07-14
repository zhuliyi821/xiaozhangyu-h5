"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Check, Store, Package, TrendingUp, Shield, Clock, BarChart3, Truck, Percent, Star } from "lucide-react";
import { C } from "@/lib/brand-colors";

const BENEFITS = [
  { icon: Store, title: "门店渠道", desc: "商品上架到合作门店，触达线下消费人群", color: C.teal },
  { icon: TrendingUp, title: "AI智能推荐", desc: "基于用户偏好和消费数据精准推送你的商品", color: C.coral },
  { icon: BarChart3, title: "数据报表", desc: "实时查看曝光量、浏览、转化等核心数据", color: C.gold },
  { icon: Truck, title: "物流对接", desc: "支持门店自提/配送多种履约方式", color: C.teal },
  { icon: Percent, title: "灵活结算", desc: "按周期结算，支持多种分润比例配置", color: C.coral },
  { icon: Star, title: "品牌曝光", desc: "平台首页推荐+AI预测页品牌展示位", color: C.gold },
];

const STEPS = [
  { num: "01", title: "提交商品信息", desc: "填写商品名称、价格、库存、图片等基础信息" },
  { num: "02", title: "平台审核", desc: "1-3个工作日完成内容合规与质量审核" },
  { num: "03", title: "上架销售", desc: "审核通过后自动上架到全网商品库，门店可采购" },
];

export default function SupplierCooperationPage() {
  const [activeBenefit, setActiveBenefit] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveBenefit(f => (f + 1) % BENEFITS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg">

      {/* ═══ Hero ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 px-5 pt-12 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/15 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium">📦 供应厂商</span>
            <span className="bg-brand-gold/30 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium">0门槛入驻</span>
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight">
            把你的产品
            <br />
            <span className="bg-gradient-to-r from-brand-gold to-amber-300 bg-clip-text text-transparent">卖到千家万户门店</span>
          </h1>
          <p className="text-[14px] text-white/80 mt-3 leading-relaxed max-w-[300px]">
            小章鱼供应链平台<br />
            门店渠道 · AI推荐 · 数据驱动
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Store, value: "0元", label: "入驻费用", sub: "免费上架" },
              { icon: Package, value: "快速", label: "审核周期", sub: "1-3工作日" },
              { icon: TrendingUp, value: "精准", label: "渠道曝光", sub: "门店+线上" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-[12px] p-3 text-center border border-white/10">
                <item.icon className="w-5 h-5 mx-auto mb-1 text-brand-gold-light" />
                <div className="text-lg font-extrabold text-brand-gold-light">{item.value}</div>
                <div className="text-[9px] text-white/70">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <a href="/marketplace"
              className="flex-1 py-3 rounded-[12px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[13px] font-semibold text-center active:scale-[0.97] transition-all shadow-lg shadow-brand-gold/30">
              📦 提交供应商品
            </a>
            <a href="/store"
              className="flex-1 py-3 rounded-[12px] bg-white/15 backdrop-blur text-white text-[13px] font-semibold text-center active:scale-[0.97] transition-all border border-white/20">
              🗺️ 合作门店
            </a>
          </div>
        </div>
      </div>

      {/* ═══ 数据条 ═══ */}
      <div className="bg-white border-b border-gray-100 py-3 px-5">
        <div className="flex items-center justify-between text-[10px] text-text-tertiary">
          <span>📦 在售商品</span>
          <span className="font-bold text-brand-teal-dark">1,280+件</span>
          <span className="text-gray-200">|</span>
          <span>🏪 覆盖门店</span>
          <span className="font-bold text-brand-coral-dark">128家</span>
          <span className="text-gray-200">|</span>
          <span>📈 月均交易</span>
          <span className="font-bold text-brand-gold-dark">50,000+笔</span>
        </div>
      </div>

      {/* ═══ 入驻流程3步 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">三步成为供应厂商</h2>
        <p className="text-[11px] text-text-tertiary mb-4">简单三步，轻松上架</p>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-[12px] p-4 shadow-sm border border-gray-100">
              <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-[13px] font-bold text-brand-teal-dark shrink-0">
                {step.num}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text-primary">{step.title}</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 6大权益 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">供应商权益</h2>
        <p className="text-[11px] text-text-tertiary mb-4">六大权益，助力销量增长</p>

        {/* 当前高亮 */}
        <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100 mb-3 transition-all duration-300"
          style={{ borderLeftColor: BENEFITS[activeBenefit].color, borderLeftWidth: 3 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: `${BENEFITS[activeBenefit].color}18` }}>
              {(() => { const Icon = BENEFITS[activeBenefit].icon; return <Icon className="w-5 h-5" style={{ color: BENEFITS[activeBenefit].color }} />; })()}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-text-primary">{BENEFITS[activeBenefit].title}</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">{BENEFITS[activeBenefit].desc}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mb-4">
          {BENEFITS.map((_, i) => (
            <div key={i} onClick={() => setActiveBenefit(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === activeBenefit ? "w-5 bg-brand-teal" : "w-1.5 bg-gray-200"}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {BENEFITS.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} onClick={() => setActiveBenefit(i)}
                className={`bg-white rounded-[10px] p-3 text-center cursor-pointer transition-all active:scale-[0.97] border ${i === activeBenefit ? "shadow-sm" : "border-gray-50"}`}
                style={i === activeBenefit ? { borderColor: f.color, backgroundColor: `${f.color}08` } : {}}>
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: f.color }} />
                <div className="text-[9px] font-medium text-text-secondary leading-tight">{f.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 对比叙事 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">传统供货 → 平台供货</h2>
        <p className="text-[11px] text-text-tertiary mb-4">一次入驻，全面升级</p>
        <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-red-400 mb-2">❌ 传统模式</div>
              <div className="space-y-2">
                {["逐一拜访门店，效率低", "账期长，回款慢", "曝光靠关系", "无数据支撑"].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-red-300 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-green-500 mb-2">✅ 平台模式</div>
              <div className="space-y-2">
                {["一键上架所有门店", "周期结算，准时到账", "AI智能推荐曝光", "实时数据报表"].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-green-700">
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CTA底部 ═══ */}
      <div className="px-5 mt-6 pb-8">
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-[16px] p-6 text-center text-white">
          <div className="text-[18px] font-bold mb-2">开启平台供货</div>
          <p className="text-[11px] text-white/80 mb-4">0门槛入驻 · 精准门店渠道 · 数据驱动增长</p>
          <a href="/marketplace"
            className="inline-block px-8 py-3 rounded-[12px] bg-white text-brand-teal-dark text-[13px] font-bold active:scale-[0.97] transition-all shadow-lg">
            📦 提交供应商品
          </a>
          <div className="mt-3 text-[10px] text-white/60">
            已是供应商？<a href="/marketplace" className="text-brand-gold-light underline">管理商品 →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
