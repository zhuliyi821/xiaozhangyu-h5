/** 🐙 小章鱼头像（使用品牌 LOGO 图片） */
export default function OctopusIcon({ className }: { className?: string }) {
  return (
    <img
      src="/octopus-avatar.png"
      alt="小章鱼"
      className={className || "w-7 h-7"}
      style={{ objectFit: "contain" }}
    />
  );
}
