import type { ComponentType } from "react";
import type { ModuleConfig } from "@/lib/store-context";

export interface ModuleProps {
  config: ModuleConfig["config"];
  storeId: number;
}

export interface ModuleDefinition {
  type: string;
  name: string;
  component: ComponentType<ModuleProps>;
  icon: string;
}

import BannerModule from "./banner";
import ProductGridModule from "./product-grid";
import CouponModule from "./coupon";

export const MODULE_COMPONENTS: Record<string, ModuleDefinition> = {
  banner: { type: "banner", name: "轮播横幅", component: BannerModule, icon: "🖼" },
  "product-grid": { type: "product-grid", name: "商品推荐", component: ProductGridModule, icon: "📦" },
  coupon: { type: "coupon", name: "优惠券", component: CouponModule, icon: "🎫" },
};

export function getModuleComponent(type: string): ComponentType<ModuleProps> | null {
  const def = MODULE_COMPONENTS[type];
  return def ? def.component : null;
}
