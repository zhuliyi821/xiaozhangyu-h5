"use client";
import { getModuleComponent } from "./modules";
import type { ModuleConfig } from "@/lib/store-context";

export default function ModuleRenderer({
  modules,
  storeId,
}: {
  modules: ModuleConfig[];
  storeId: number;
}) {
  const sorted = [...modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!sorted.length) {
    return (
      <div className="px-3 mt-3">
        <div className="rounded-[12px] border border-dashed border-gray-200 p-6 text-center text-gray-400 text-[12px]">
          暂无内容模块，请在商户后台添加
        </div>
      </div>
    );
  }

  return (
    <>
      {sorted.map((mod) => {
        const Component = getModuleComponent(mod.type);
        if (!Component) return null;
        return <Component key={mod.id} config={mod.config} storeId={storeId} />;
      })}
    </>
  );
}
