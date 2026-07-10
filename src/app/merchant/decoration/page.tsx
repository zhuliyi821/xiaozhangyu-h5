"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA" };

export default function DecorationPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [deco, setDeco] = useState<any>(null);
  const [sid, setSid] = useState(10007);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          setSid(d.data.stores[0].id);
          return d.data.stores[0].id;
        }
      })
      .then(id => {
        fetch(`/plugins/api-store-decoration.php?api=decoration&store_id=${id}`)
          .then(r => r.json())
          .then(j => { if (j.code === 0) setDeco(j.data); })
          .catch(() => {});
      })
      .catch(() => {});
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  const modules = deco?.modules || [];

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店装修</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">装修门店聚合详情页展示效果</p>
          </div>
        </div>
      </div>

      {/* 品牌色 */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-medium">品牌主题色</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-200" style={{backgroundColor: deco?.theme_color || "#45CCD5"}} />
              <span className="text-[10px] text-gray-400">{deco?.theme_color || "#45CCD5"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {["#F27152","#45CCD5","#F2B631","#8B5CF6","#10B981","#3B82F6"].map(c => (
              <div key={c} className="w-7 h-7 rounded-full cursor-pointer active:scale-90 border border-gray-100" style={{backgroundColor: c}} />
            ))}
          </div>
        </div>
      </div>

      {/* 模块列表 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[13px] font-medium mb-3">展示模块</div>
          <div className="space-y-3">
            <ModuleItem
              type="banner" icon="🖼️" label="轮播图"
              desc="展示门店形象图片"
              enabled={modules.some((m:any) => m.type === "banner" && m.enabled !== false)}
              config={modules.find((m:any) => m.type === "banner")?.config}
            />
            <ModuleItem
              type="coupon" icon="🎫" label="优惠券"
              desc="展示可领取优惠券"
              enabled={modules.some((m:any) => m.type === "coupon" && m.enabled !== false)}
              config={modules.find((m:any) => m.type === "coupon")?.config}
            />
            <ModuleItem
              type="notice" icon="📢" label="公告"
              desc="展示门店公告信息"
              enabled={modules.some((m:any) => m.type === "notice" && m.enabled !== false)}
              config={modules.find((m:any) => m.type === "notice")?.config}
            />
            <ModuleItem
              type="product" icon="📦" label="商品推荐"
              desc="展示精选推荐商品"
              enabled={modules.some((m:any) => m.type === "product" && m.enabled !== false)}
              config={undefined}
            />
            <ModuleItem
              type="store-intro" icon="📝" label="门店介绍"
              desc="展示门店详细描述"
              enabled={modules.some((m:any) => m.type === "store-intro" && m.enabled !== false)}
              config={undefined}
            />
          </div>
        </div>
      </div>

      {/* 预览提示 */}
      <div className="mx-4 mt-3">
        <div onClick={() => window.open(`/store/${sid}`, "_blank")}
          className="bg-white rounded-[10px] p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.97] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.teal}15`}}>
              <span className="text-base">👁️</span>
            </div>
            <div>
              <div className="text-[13px] font-medium">预览门店详情页</div>
              <div className="text-[10px] text-gray-400">查看装修效果</div>
            </div>
          </div>
          <span className="text-lg">→</span>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

function ModuleItem({ type, icon, label, desc, enabled, config }: { type: string; icon: string; label: string; desc: string; enabled: boolean; config: any }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-base" style={{backgroundColor: `${enabled ? "#45CCD5" : "#ccc"}15`}}>
          {icon}
        </div>
        <div>
          <div className="text-[12px] font-medium">{label}</div>
          <div className="text-[9px] text-gray-400">{desc}</div>
          {config && type === "banner" && config.images && (
            <div className="text-[9px] text-gray-300 mt-0.5">{config.images.length} 张图片</div>
          )}
          {config && type === "coupon" && config.coupons && (
            <div className="text-[9px] text-gray-300 mt-0.5">{config.coupons.length} 张优惠券</div>
          )}
          {config && type === "notice" && config.text && (
            <div className="text-[9px] text-gray-300 mt-0.5 line-clamp-1">{config.text}</div>
          )}
        </div>
      </div>
      <span className={`text-[9px] px-2 py-0.5 rounded-full ${enabled ? "text-[#10B981] bg-[#10B981]15" : "text-gray-300 bg-gray-50"}`}>
        {enabled ? "已启用" : "未启用"}
      </span>
    </div>
  );
}
