"use client";
import ModuleRenderer from "../module-renderer";
import type { TemplateProps } from "@/lib/template-registry";

export default function RetailTemplate({ modules, storeId }: TemplateProps) {
  return (
    <div>
      <ModuleRenderer modules={modules} storeId={storeId} />
    </div>
  );
}
