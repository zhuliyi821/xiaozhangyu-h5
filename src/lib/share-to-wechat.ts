/**
 * 统一分享工具
 *
 * 策略（仅一条）：
 * 复制内容到剪贴板 → 提示用户去微信粘贴
 *
 * 在微信内置浏览器内，JS-SDK（wechat-jssdk.ts）负责拦截右上角「...」分享事件；
 * 本模块仅处理用户主动点击分享按钮的场景。
 */

let toastTimer: ReturnType<typeof setTimeout> | null = null;

/** 显示一个自动消失的 Toast */
function showToast(msg: string, duration = 3000) {
  if (toastTimer) clearTimeout(toastTimer);
  document.querySelectorAll("#wechat-share-toast").forEach((el) => el.remove());

  const toast = document.createElement("div");
  toast.id = "wechat-share-toast";
  toast.innerHTML = msg;
  Object.assign(toast.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "9999",
    background: "rgba(0,0,0,0.82)",
    color: "#fff",
    fontSize: "13px",
    padding: "20px 28px",
    borderRadius: "16px",
    textAlign: "center",
    lineHeight: "1.7",
    maxWidth: "300px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.2s ease",
  });
  document.body.appendChild(toast);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/** 复制文本到剪贴板 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/**
 * 分享 — 核心函数
 *
 * 剪贴板复制 → Toast 提示用户去微信粘贴
 * 微信内分享卡片的 JS-SDK 由 wechat-jssdk.ts 自动处理
 *
 * @param content 分享的文本/链接
 * @param posterUrl 可选海报图片 URL（仅用于记录，不参与流程）
 */
export async function shareToWeChat(content: string, posterUrl?: string) {
  await copyToClipboard(content);

  // 判断是否在微信浏览器内
  const isWeChat = /micromessenger/i.test(navigator.userAgent);

  showToast(
    isWeChat
      ? `✅ 已复制到剪贴板<br/>点击右上角「...」<br/>粘贴给好友吧 💬`
      : `✅ 已复制到剪贴板<br/>打开微信，粘贴发送给好友 💬`
  );
}

/**
 * 获取当前页面所在域（用于分享链接，避免硬编码）
 */
export function getShareOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://ws.hi.cn";
}

/**
 * 生成分享文本（统一格式）
 */
export function buildShareText(
  title: string,
  body: string,
  url?: string
): string {
  const link = url || (typeof window !== "undefined" ? window.location.href : "");
  return `${title}\n${body}\n${link}\n—— 来自 小章鱼 · AI趣预测`;
}

/**
 * 注入 fadeIn 动画
 */
export function injectShareAnimations() {
  if (typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
    #wechat-share-toast button { background:#45CCD5; color:#fff; border:none; border-radius:10px; padding:6px 16px; font-size:12px; margin-top:8px; cursor:pointer; }
  `;
  document.head.appendChild(style);
}
