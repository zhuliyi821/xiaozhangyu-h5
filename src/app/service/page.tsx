import { redirect } from "next/navigation";

/**
 * 服务号入口 — 直接跳转主首页
 * 服务号即为小章鱼·AI趣预测主 app，避免重复造轮子
 */
export default function ServicePage() {
  redirect("/");
}
