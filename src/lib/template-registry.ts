import type { IndustryType } from "./store-context";
import type { ComponentType } from "react";

export interface TemplateProps {
  modules: any[];
  storeId: number;
}

export interface TemplateDefinition {
  id: IndustryType;
  name: string;
  component: ComponentType<TemplateProps>;
}

import FoodTemplate from "@/templates/industries/food";
import RetailTemplate from "@/templates/industries/retail";
import ServiceTemplate from "@/templates/industries/service";
import EntertainmentTemplate from "@/templates/industries/entertainment";
import LifestyleTemplate from "@/templates/industries/lifestyle";

export const INDUSTRY_TEMPLATES: Record<IndustryType, TemplateDefinition> = {
  food: { id: "food", name: "餐饮美食", component: FoodTemplate },
  retail: { id: "retail", name: "零售购物", component: RetailTemplate },
  service: { id: "service", name: "生活服务", component: ServiceTemplate },
  entertainment: { id: "entertainment", name: "娱乐休闲", component: EntertainmentTemplate },
  lifestyle: { id: "lifestyle", name: "品质生活", component: LifestyleTemplate },
};

export function getTemplate(id: IndustryType): TemplateDefinition {
  return INDUSTRY_TEMPLATES[id] || INDUSTRY_TEMPLATES.food;
}
