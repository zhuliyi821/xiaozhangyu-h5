import OctopusIcon from './octopus-icon';

interface Props {
  balance: number;
  user: any;
  onLogin: () => void;
}

export default function ChatHeader({ balance, user, onLogin }: Props) {
  return (
    <div className="sticky top-0 z-30 bg-gradient-to-r from-brand-teal to-brand-teal-dark px-4 py-3 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
        <OctopusIcon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-white">小章鱼</div>
        <div className="text-[10px] text-white/60">在线 · AI运势顾问</div>
      </div>
      <button onClick={onLogin} className="bg-white/15 rounded-full px-3 py-1 flex items-center gap-1.5 active:scale-95 transition-transform">
        <span className="text-[11px]">🎮</span>
        <span className="text-[11px] text-white font-medium">
          {user ? (balance >= 1000 ? (balance / 1000).toFixed(1) + 'k' : balance) : '未登录'}
        </span>
      </button>
      {!user && (
        <button onClick={onLogin} className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full">登录</button>
      )}
    </div>
  );
}
