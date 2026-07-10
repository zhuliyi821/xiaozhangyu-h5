/**
 * WeChat JS-SDK 封装
 *
 * 功能：
 *   1. 加载微信 JS-SDK
 *   2. wx.config() 注入权限验证
 *   3. wx.ready() 自定义分享卡片
 */

const WECHAT_API_URL = '/api/wechat';

interface WxConfig {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

let sdkLoaded = false;
let configReady = false;

/** 加载微信 JS-SDK 脚本 */
function loadWxSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).wx?.config) {
      sdkLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.onload = () => {
      sdkLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("WeChat JS-SDK 加载失败"));
    document.head.appendChild(script);
  });
}

/** 从后端获取签名配置 */
async function fetchConfig(currentUrl: string): Promise<WxConfig> {
  const res = await fetch(`${WECHAT_API_URL}?action=js_config&url=${encodeURIComponent(currentUrl)}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || "获取微信配置失败");
  return json.data;
}

/**
 * 初始化微信 JS-SDK
 * 需在每次页面路由变化时调用（签名绑定当前 URL）
 */
export async function initWeChatSdk(currentUrl?: string): Promise<void> {
  try {
    const url = currentUrl || window.location.href;
    await loadWxSdk();
    const config = await fetchConfig(url);

    wx.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: [
        "updateAppMessageShareData",
        "updateTimelineShareData",
        "onMenuShareAppMessage",
        "onMenuShareTimeline",
        "hideOptionMenu",
        "showOptionMenu",
        "hideMenuItems",
        "showMenuItems",
        "closeWindow",
      ],
    });

    wx.ready(() => {
      configReady = true;
    });

    wx.error((err: any) => {
      console.warn("[WeChat JS-SDK] config error:", err);
    });
  } catch (err) {
    console.warn("[WeChat JS-SDK] init failed:", err);
  }
}

/**
 * 设置微信分享卡片
 * @param share 分享内容
 * @param timelineOnly 仅限朋友圈
 */
export function setWeChatShare(share: ShareConfig, timelineOnly = false): void {
  if (!sdkLoaded || !configReady) {
    // SDK 未就绪，等 ready 后再设
    const check = setInterval(() => {
      if (configReady) {
        clearInterval(check);
        doSetShare(share, timelineOnly);
      }
    }, 200);
    setTimeout(() => clearInterval(check), 10000); // 10s 超时
    return;
  }
  doSetShare(share, timelineOnly);
}

function doSetShare(share: ShareConfig, timelineOnly: boolean): void {
  if (typeof wx === "undefined") return;

  wx.updateAppMessageShareData({
    title: share.title,
    desc: share.desc,
    link: share.link,
    imgUrl: share.imgUrl,
    success: () => {},
  });

  wx.updateTimelineShareData({
    title: share.title,
    link: share.link,
    imgUrl: share.imgUrl,
    success: () => {},
  });

  // 兼容旧版本
  if (!timelineOnly) {
    wx.onMenuShareAppMessage({
      title: share.title,
      desc: share.desc,
      link: share.link,
      imgUrl: share.imgUrl,
    });
  }
  wx.onMenuShareTimeline({
    title: share.title,
    link: share.link,
    imgUrl: share.imgUrl,
  });
}
