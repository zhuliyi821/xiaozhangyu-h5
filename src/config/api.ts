/**
 * 统一 API 配置
 * 
 * 所有 API 调用从此文件获取 base URL 和通用配置。
 * 禁止在各页面文件中重复定义 API_BASE。
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";
export const API_V2 = `${API_BASE}/api/v2`;

export const API_CONFIG = {
  baseUrl: API_BASE,
  timeout: 15000,        // 15s 超时
  retryCount: 1,         // 自动重试次数
  retryDelay: 1000,      // 重试间隔 ms
} as const;

/**
 * 🔑 全局 401/未授权 回调
 * 由 AuthProvider 在 mount 时设置，当 apiFetch 检测到 401 时自动调用
 *
 * 防爆处理：同一会话只触发一次 logout，避免级联 401 把用户反复踢出
 */
let _onUnauthorized: (() => void) | null = null;
let _unauthorizedFiredAt = 0;
export function setOnUnauthorized(fn: (() => void) | null) {
  _onUnauthorized = fn;
  _unauthorizedFiredAt = 0; // 重置时清空节流
}

/**
 * 统一 API 调用封装
 *
 * 兼容性：
 *   - 微信 X5/TBS 浏览器（WebView）
 *   - 老版本 WebKit（无 AbortController / 无 URL）
 *   - 网络慢/HTTPS 自签名场景
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  // ── URL 构造（兼容老 Webkit） ──
  let url: string;
  try {
    const u = new URL(path, API_BASE);
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => u.searchParams.set(k, v));
    }
    url = u.toString();
  } catch {
    // 兜底：手动拼接
    const base = API_BASE.replace(/\/$/, "");
    const sep = path.includes("?") ? "&" : "?";
    const extra = options.params
      ? "?" + Object.entries(options.params).map(([k, v]) => `${k}=${v}`).join("&")
      : "";
    url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : "/" + path}${extra}`;
  }

  // ── 超时控制（兼容老 Webkit 无 AbortController） ──
  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller?.abort(), API_CONFIG.timeout);
  } catch {
    // 老 Webkit 无 AbortController — 用 Promise.race 实现超时
    controller = null;
  }

  // ── 真正的 fetch 执行 ──
  let res: Response;
  try {
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        ...options.headers,
      },
    };
    if (controller) fetchOptions.signal = controller.signal;

    res = await Promise.race([
      fetch(url, fetchOptions),
      new Promise<Response>((_, reject) => {
        if (timeoutId) {
          // 已有 setTimeout 控制
          return;
        }
        // 兜底超时
        setTimeout(() => reject(new Error("timeout")), API_CONFIG.timeout);
      }),
    ]) as Response;
  } catch (err) {
    throw new ApiError((err as Error).message || "网络错误", 0);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // 401 统一拦截 — token 过期/无效，自动退出登录
  // 防爆：60秒内只触发一次 logout，避免级联 401 把用户反复踢出
  if (res.status === 401) {
    const now = Date.now();
    if (_onUnauthorized && now - _unauthorizedFiredAt > 60_000) {
      _unauthorizedFiredAt = now;
      try { setTimeout(_onUnauthorized, 0); } catch { /* ignore */ }
    }
    throw new ApiError("登录已过期，请重新登录", 401, 401);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("响应格式错误", 0);
  }

  // 统一响应格式检测 (兼容 3 种格式)
  if (isErrorResponse(json)) {
    throw new ApiError(json.msg || json.message || getErrorMsg(json), getErrorCode(json));
  }

  return json.data ?? json;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number = 0,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 响应格式检测：判断是否为错误响应
 * 兼容 {result:0, msg:"..."} / {code:0, msg:"..."} / {code:200, msg:"..."}
 */
function isErrorResponse(json: any): boolean {
  if (json.result !== undefined) return json.result !== 1;
  if (json.code !== undefined) return json.code !== 0 && json.code !== 200;
  return false;
}

function getErrorCode(json: any): number {
  return json.result ?? json.code ?? 0;
}

function getErrorMsg(json: any): string {
  return json.msg || json.message || json.error || "未知错误";
}
