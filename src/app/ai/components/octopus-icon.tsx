/** 🐙 小章鱼头像 */
export default function OctopusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className || "w-7 h-7"} xmlns="http://www.w3.org/2000/svg">
      {/* 主头 */}
      <ellipse cx="24" cy="22" rx="12" ry="11" fill="#06B6D4" />
      {/* 眼睛 */}
      <circle cx="19" cy="19" r="3.5" fill="white" />
      <circle cx="29" cy="19" r="3.5" fill="white" />
      <circle cx="20" cy="19" r="1.8" fill="#27272a" />
      <circle cx="30" cy="19" r="1.8" fill="#27272a" />
      {/* 微笑 */}
      <path d="M19 26 Q24 31 29 26" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 触须 */}
      <path d="M12 24 C8 28 6 34 8 38" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 22 C6 26 3 32 4 37" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 27 C10 32 10 38 13 42" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M36 24 C40 28 42 34 40 38" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M37 22 C42 26 45 32 44 37" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 27 C38 32 38 38 35 42" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round" />
      {/* 头顶小圆点 */}
      <circle cx="20" cy="13" r="1.2" fill="#0D9488" opacity="0.5" />
      <circle cx="24" cy="12" r="1.2" fill="#0D9488" opacity="0.5" />
      <circle cx="28" cy="13" r="1.2" fill="#0D9488" opacity="0.5" />
    </svg>
  );
}
