"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Check, MapPin, Shield, TrendingUp, Users, Store, Award, Target, Building, Globe } from "lucide-react";
import { C } from "@/lib/brand-colors";


const REGIONS = [
  { name: "华东地区", provinces: "上海·江苏·浙江·安徽·福建·江西·山东", color: "from-blue-500 to-blue-600" },
  { name: "华南地区", provinces: "广东·广西·海南", color: "from-green-500 to-green-600" },
  { name: "华中地区", provinces: "湖北·湖南·河南", color: "from-orange-500 to-orange-600" },
  { name: "华北地区", provinces: "北京·天津·河北·山西·内蒙古", color: "from-red-500 to-red-600" },
  { name: "西南地区", provinces: "重庆·四川·贵州·云南·西藏", color: "from-purple-500 to-purple-600" },
  { name: "西北地区", provinces: "陕西·甘肃·青海·宁夏·新疆", color: "from-amber-500 to-amber-600" },
  { name: "东北地区", provinces: "辽宁·吉林·黑龙江", color: "from-teal-500 to-teal-600" },
];

const QUALIFICATIONS = [
  "具有独立法人资格的企/事业单位",
  "注册资金不低于100万元",
  "拥有3人以上的本地运营团队",
  "熟悉本地商户资源与商业环境",
  "认可小章鱼品牌理念与合作模式",
];

const SUPPORT = [
  { icon: Store, title: "品牌授权", desc: "授予区域独家品牌使用权及区域保护" },
  { icon: Target, title: "培训支持", desc: "总部提供7天系统化运营培训+实操陪跑" },
  { icon: Users, title: "客户资源", desc: "总部提供区域内意向客户线索分配" },
  { icon: Building, title: "联合营销", desc: "总部定期组织区域联合推广活动" },
  { icon: Award, title: "荣誉认证", desc: "授权牌+区域运营中心挂牌" },
];

export default function RegionalPartnerPage() {
  const [activeRegion, setActiveRegion] = useState(0);

  return (
    <div className="min-h-screen bg-bg">

      {/* ═══ Hero ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 px-5 pt-12 pb-16">
          <span className="inline-block bg-white/15 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium mb-4">📍 区域合伙人</span>
          <h1 className="text-[28px] font-extrabold leading-tight">
            成为区域合伙人
            <br />
            <span className="bg-gradient-to-r from-brand-gold to-amber-300 bg-clip-text text-transparent">共享AI门店万亿市场</span>
          </h1>
          <p className="text-[14px] text-white/80 mt-3 leading-relaxed max-w-[300px]">
            行政区域独家代理 · 购买50套AI门店系统<br />
            12个月销售收入未达3倍，公司补齐
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: MapPin, value: "独家", label: "区域保护", sub: "一区一代理" },
              { icon: Shield, value: "50套", label: "软件起售", sub: "AI门店系统" },
              { icon: TrendingUp, value: "3倍", label: "收入保障", sub: "未达标公司补" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-[12px] p-3 text-center border border-white/10">
                <item.icon className="w-5 h-5 mx-auto mb-1 text-brand-gold-light" />
                <div className="text-lg font-extrabold text-brand-gold-light">{item.value}</div>
                <div className="text-[9px] text-white/70">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <a href="#region"
              className="block w-full py-3 rounded-[12px] bg-gradient-to-r from-brand-gold to-amber-500 text-white text-[13px] font-semibold text-center active:scale-[0.97] transition-all shadow-lg shadow-brand-gold/30">
              📍 查看区域名额 →
            </a>
          </div>
        </div>
      </div>

      {/* ═══ 核心承诺 ═══ */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-br from-green-50 to-white rounded-[16px] p-5 border-2 border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-[14px] font-bold text-green-800">12个月收入保障计划</span>
          </div>
          <p className="text-[12px] text-green-700 leading-relaxed">
            投资<b>50万元+</b>（含<b>50套</b>AI门店自动化运营系统），从首批系统交付之日起<b>12个月内</b>，
            若代理商销售收入（含系统销售+门店服务抽成）未达到投资额的<b>3倍</b>，
            <b className="text-green-900">差额由公司全额补齐</b>，保障您的投资回报。
          </p>
        </div>
      </div>

      {/* ═══ 投资方案 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">投资方案</h2>
        <p className="text-[11px] text-text-tertiary mb-4">50万元起，含50套AI门店系统</p>

        {/* 方案详情 */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-[16px] p-5 border-2 shadow-sm" style={{ borderColor: C.gold }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[15px] font-bold text-text-primary">🏘️ 区域代理</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">区/县级 · 一区一代理</div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-extrabold" style={{ color: C.coral }}>50万元+</div>
              <div className="text-[9px] text-gray-400">含50套AI门店系统</div>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-text-secondary">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>区/县级独家代理权，辖区范围内</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>含 50 套AI门店自动化运营系统</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>12个月3倍收入保障，未达标公司补齐</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>总部7天培训 + 区域运营中心挂牌</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 行政区域名额 ═══ */}
      <div id="region" className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">行政区域名额</h2>
        <p className="text-[11px] text-text-tertiary mb-4">全国7大区域，限量招募独家合伙人</p>

        {/* 区域Tab */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
          {REGIONS.map((r, i) => (
            <button key={i} onClick={() => setActiveRegion(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                i === activeRegion ? "text-white" : "bg-white border border-gray-100 text-text-secondary"
              }`}
              style={i === activeRegion ? { background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})` } : {}}>
              {r.name}
            </button>
          ))}
        </div>

        {/* 区域详情 */}
        <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4" style={{ color: C.teal }} />
            <span className="text-[13px] font-bold text-text-primary">{REGIONS[activeRegion].name}</span>
          </div>
          <p className="text-[11px] text-text-tertiary">{REGIONS[activeRegion].provinces}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px]">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-600 font-medium">名额开放中</span>
            <span className="text-gray-300">|</span>
            <span className="text-text-tertiary">仅剩 <b className="text-brand-coral">{(7 - activeRegion) % 7 + 1}</b> 席</span>
          </div>
        </div>
      </div>

      {/* ═══ 代理资格 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">代理资格</h2>
        <p className="text-[11px] text-text-tertiary mb-4">需满足以下基本条件</p>
        <div className="space-y-2">
          {QUALIFICATIONS.map((q, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-white rounded-[10px] p-3 shadow-sm border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center text-[10px] font-bold text-brand-teal-dark shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-[12px] text-text-secondary leading-relaxed">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 总部支持 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">总部支持</h2>
        <p className="text-[11px] text-text-tertiary mb-4">5大支持体系，助力区域业务落地</p>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORT.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-[10px] p-3 shadow-sm border border-gray-100">
                <Icon className="w-5 h-5 mb-1.5" style={{ color: [C.teal, C.coral, C.gold, C.teal, C.coral][i % 3] }} />
                <div className="text-[11px] font-semibold text-text-primary">{s.title}</div>
                <div className="text-[9px] text-text-tertiary mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 合作流程 ═══ */}
      <div className="px-5 mt-6">
        <h2 className="text-[16px] font-bold text-text-primary mb-1">合作流程</h2>
        <p className="text-[11px] text-text-tertiary mb-4">简单5步，启动区域业务</p>
        <div className="space-y-2">
          {[
            { step: "01", title: "提交申请", desc: "填写区域代理申请表" },
            { step: "02", title: "资质审核", desc: "总部审核资质与区域名额" },
            { step: "03", title: "签约付款", desc: "签署代理协议，购买50套系统" },
            { step: "04", title: "系统交付", desc: "区域运营中心挂牌+系统交付" },
            { step: "05", title: "运营启动", desc: "7天培训+区域业务正式启动" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-[10px] p-3.5 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-[8px] bg-brand-teal/10 flex items-center justify-center text-[12px] font-bold text-brand-teal-dark shrink-0">
                {s.step}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-text-primary">{s.title}</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div className="px-5 mt-6 pb-8">
        <div className="bg-gradient-to-br from-brand-teal-dark via-brand-teal to-brand-teal rounded-[16px] p-6 text-center text-white">
          <div className="text-[18px] font-bold mb-2">成为区域合伙人</div>
          <p className="text-[11px] text-white/80 mb-4">独家区域代理 · 50套起售 · 12个月3倍收入保障</p>
          <a href="#region"
            className="inline-block px-8 py-3 rounded-[12px] bg-white text-brand-teal-dark text-[13px] font-bold active:scale-[0.97] transition-all shadow-lg">
            📍 查看区域名额
          </a>
          <div className="mt-3 text-[10px] text-white/60">
            已有合作意向？<a href="tel:4000000000" className="text-brand-gold-light underline">联系我们 →</a>
          </div>
        </div>
      </div>

    </div>
  );
}
