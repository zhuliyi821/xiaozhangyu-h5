/** WeChat JS-SDK 全局类型声明 */
interface Wx {
  config(config: {
    debug: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }): void;
  ready(callback: () => void): void;
  error(callback: (err: any) => void): void;
  updateAppMessageShareData(data: {
    title: string;
    desc: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }): void;
  updateTimelineShareData(data: {
    title: string;
    link: string;
    imgUrl: string;
    success?: () => void;
  }): void;
  onMenuShareAppMessage(data: {
    title: string;
    desc: string;
    link: string;
    imgUrl: string;
  }): void;
  onMenuShareTimeline(data: {
    title: string;
    link: string;
    imgUrl: string;
  }): void;
  hideOptionMenu(): void;
  showOptionMenu(): void;
  hideMenuItems(data: { menuList: string[] }): void;
  showMenuItems(data: { menuList: string[] }): void;
  closeWindow(): void;
}

declare const wx: Wx;
