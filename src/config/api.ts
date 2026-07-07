/**
 * 统一 API 配置
 * 
 * 所有 API 调用从此文件获取 base URL 和通用配置。
 * 禁止在各页面文件中重复定义 API_BASE。
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";

export const API_CONFIG = {
  baseUrl: API_BASE,
  timeout: 15000,        // 15s 超时
  retryCount: 1,         // 自动重试次数
  retryDelay: 1000,      // 重试间隔 ms
} as const;

/**
 * 统一 API 调用封装
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const res = await fetch(url.toString(), {
      ...options,
      signal: controller.signal,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    // 统一响应格式检测 (兼容 3 种格式)
    if (isErrorResponse(json)) {
      throw new ApiError(json.msg || getErrorMsg(json), getErrorCode(json));
    }

    return json.data ?? json;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError("请求超时", 408);
    }
    throw new ApiError((err as Error).message || "网络错误", 0);
  } finally {
    clearTimeout(timeoutId);
  }
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
