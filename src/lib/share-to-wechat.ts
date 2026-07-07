/**
 * 统一分享到微信工具
 *
 * 点击分享按钮 → 复制内容到剪贴板 → 提示用户去微信粘贴
 * 同时尝试通过 URL Scheme 打开微信 App
 *
 * 这是在不接入微信 JS-SDK 前提下，最接近"直接分享到微信"的体验。
 */

let toastTimer: ReturnType<typeof setTimeout> | null = null;

/** 显示一个自动消失的 Toast */
function showToast(msg: string, duration = 2500) {
  if (toastTimer) clearTimeout(toastTimer);
  // 移除已有 toast
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
    padding: "16px 24px",
    borderRadius: "16px",
    textAlign: "center",
    lineHeight: "1.6",
    maxWidth: "280px",
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

/** 尝试通过 URL Scheme 打开微信 */
function tryOpenWeChat() {
  // Android: weixin:// 协议
  // iOS: 不支持直接打开，但仍尝试
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = "weixin://";
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 3000);
}

/**
 * 分享到微信 — 核心函数
 *
 * @param content 分享的文本/链接内容
 * @param posterUrl 可选的海报图片 URL（生成后传入）
 */
export async function shareToWeChat(content: string, posterUrl?: string) {
  // 1. 复制内容到剪贴板
  try {
    await navigator.clipboard.writeText(content);
  } catch {
    // 降级：创建 textarea 复制
    const ta = document.createElement("textarea");
    ta.value = content;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  // 2. 尝试打开微信
  tryOpenWeChat();

  // 3. 显示提示
  showToast(
    `✅ 已复制到剪贴板<br/>去微信粘贴给好友吧 💬<br/><br/>` +
    `<span style="font-size:11px;opacity:0.7">正在尝试打开微信...</span>`
  );
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
 * 注入 fadeIn 动画（在 app 入口处调用一次即可）
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
