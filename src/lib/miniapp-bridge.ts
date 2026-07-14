/**
 * 小章鱼 H5 ↔ 小程序通信桥
 *
 * 使用场景：
 *   H5 在 mini-program web-view 内运行时，调用此桥通知小程序
 *
 * 用法：
 *   import { navigateToMiniApp, triggerMiniShare } from '@/lib/miniapp-bridge';
 *
 *   // 跳转到小程序原生分享页
 *   triggerMiniShare({ id: '123', title: '商品名', img: 'https://...' });
 */

/** 是否在小程序 web-view 内运行 */
export function isInMiniApp(): boolean {
  return typeof window !== 'undefined' && (
    // @ts-ignore
    typeof window.wx !== 'undefined' && window.wx?.miniProgram
  );
}

/** 获取小程序环境信息 */
export function getMiniEnv(): any {
  if (typeof window === 'undefined') return null;
  // @ts-ignore
  return window.wx?.miniProgram?.env || null;
}

/**
 * 触发小程序原生分享
 *
 * 调用后跳转到小程序的 product/store 原生页，
 * 该页面有 open-type="share" 按钮 → 弹出微信联系人选择器
 */
export function triggerMiniShare(params: {
  type?: 'product' | 'store';
  id?: string;
  storeId?: string;
  title: string;
  img?: string;
}) {
  // @ts-ignore
  if (typeof window === 'undefined' || !window.wx?.miniProgram) {
    // 不在小程序内，走 H5 分享
    const { shareToWeChat, buildShareText } = require('./share-to-wechat');
    const content = buildShareText(params.title, '');
    shareToWeChat(content);
    return;
  }

  const { type = 'product', id, storeId, title, img } = params;

  const path = type === 'store' ? 'store' : 'product';
  const query = type === 'store'
    ? `id=${id}&name=${encodeURIComponent(title)}&img=${encodeURIComponent(img || '')}`
    : `id=${id}&store_id=${storeId || ''}&title=${encodeURIComponent(title)}&img=${encodeURIComponent(img || '')}`;

  // @ts-ignore
  window.wx.miniProgram.navigateTo({
    url: `/pages/${path}/${path}?${query}`,
  });
}

/**
 * 通知小程序更新分享信息（当 H5 页面数据加载完成后）
 */
export function updateMiniShareInfo(params: { title?: string; img?: string }) {
  // @ts-ignore
  if (typeof window === 'undefined' || !window.wx?.miniProgram) return;

  // @ts-ignore
  window.wx.miniProgram.postMessage({
    data: {
      type: 'share_update',
      ...params,
    },
  });
}

/**
 * 登录：将小程序 token 传递给 H5
 */
export function setTokenForH5(token: string) {
  if (typeof window !== 'undefined') {
    (window as any).__MINI_TOKEN__ = token;
  }
}

/**
 * 获取小程序传递的 token
 */
export function getTokenFromMiniApp(): string | null {
  if (typeof window === 'undefined') return null;
  // 如果 URL 里有 token 参数
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) return token;

  // 从全局变量获取
  return (window as any).__MINI_TOKEN__ || null;
}
