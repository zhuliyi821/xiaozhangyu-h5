"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/config/api";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const SHI_CHEN: { label: string; hour: number; range: string }[] = [
  { label: "子时", hour: 23, range: "23:00-01:00" },
  { label: "丑时", hour: 1, range: "01:00-03:00" },
  { label: "寅时", hour: 3, range: "03:00-05:00" },
  { label: "卯时", hour: 5, range: "05:00-07:00" },
  { label: "辰时", hour: 7, range: "07:00-09:00" },
  { label: "巳时", hour: 9, range: "09:00-11:00" },
  { label: "午时", hour: 11, range: "11:00-13:00" },
  { label: "未时", hour: 13, range: "13:00-15:00" },
  { label: "申时", hour: 15, range: "15:00-17:00" },
  { label: "酉时", hour: 17, range: "17:00-19:00" },
  { label: "戌时", hour: 19, range: "19:00-21:00" },
  { label: "亥时", hour: 21, range: "21:00-23:00" },
];

const CITIES: { name: string; longitude: number }[] = [
  { name: "北京", longitude: 116.4 },
  { name: "上海", longitude: 121.5 },
  { name: "广州", longitude: 113.3 },
  { name: "深圳", longitude: 114.1 },
  { name: "成都", longitude: 104.1 },
  { name: "杭州", longitude: 120.2 },
  { name: "武汉", longitude: 114.3 },
  { name: "西安", longitude: 108.9 },
  { name: "重庆", longitude: 106.5 },
  { name: "南京", longitude: 118.8 },
  { name: "苏州", longitude: 120.6 },
  { name: "天津", longitude: 117.2 },
  { name: "长沙", longitude: 113.0 },
  { name: "郑州", longitude: 113.7 },
  { name: "东莞", longitude: 113.8 },
  { name: "青岛", longitude: 120.4 },
  { name: "沈阳", longitude: 123.4 },
  { name: "宁波", longitude: 121.5 },
  { name: "昆明", longitude: 102.7 },
  { name: "大连", longitude: 121.6 },
  { name: "厦门", longitude: 118.1 },
  { name: "合肥", longitude: 117.3 },
  { name: "佛山", longitude: 113.1 },
  { name: "福州", longitude: 119.3 },
  { name: "哈尔滨", longitude: 126.6 },
  { name: "济南", longitude: 117.0 },
  { name: "温州", longitude: 120.7 },
  { name: "南宁", longitude: 108.4 },
  { name: "长春", longitude: 125.3 },
  { name: "泉州", longitude: 118.6 },
  { name: "石家庄", longitude: 114.5 },
  { name: "贵阳", longitude: 106.7 },
  { name: "南昌", longitude: 115.9 },
  { name: "金华", longitude: 119.6 },
  { name: "常州", longitude: 119.9 },
  { name: "嘉兴", longitude: 120.8 },
  { name: "南通", longitude: 120.9 },
  { name: "太原", longitude: 112.5 },
  { name: "徐州", longitude: 117.2 },
  { name: "海口", longitude: 110.4 },
  { name: "乌鲁木齐", longitude: 87.6 },
  { name: "兰州", longitude: 103.8 },
  { name: "拉萨", longitude: 91.1 },
];

export default function BirthPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const [date, setDate] = useState("");
  const [hour, setHour] = useState(12);
  const [gender, setGender] = useState(1);
  const [isLunar, setIsLunar] = useState(false);
  const [city, setCity] = useState("北京");
  const [customLongitude, setCustomLongitude] = useState("120.0");
  const [useCustomLongitude, setUseCustomLongitude] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [bazi, setBazi] = useState<any>(null);

  // 注册成功后3秒倒计时自动跳回AI页
  useEffect(() => {
    if (success) {
      setCountdown(3);
      const ti = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
      const t = setTimeout(() => router.push("/ai"), 3000);
      return () => { clearTimeout(t); clearInterval(ti); };
    }
  }, [success]);

  const getLongitude = () => {
    if (useCustomLongitude) return parseFloat(customLongitude) || 120.0;
    const found = CITIES.find(c => c.name === city);
    return found?.longitude || 120.0;
  };

  const submit = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!date) { setMsg("请选择出生日期"); return; }

    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(API_BASE + "/api/ai/birth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          birth_date: date,
          birth_hour: hour,
          gender,
          is_lunar: isLunar,
          longitude: getLongitude(),
        }),
      });
      const json = await res.json();
      if (json.code === 0) {
        setSuccess(true);
        // 保存八字数据用于展示
        if (json.ba_zi) setBazi(json.ba_zi);
        if (json.data?.personality) setBazi((p: any) => ({ ...p, personality: json.data.personality }));
        setMsg("✅ " + json.msg);
      } else {
        setMsg("❌ 保存失败: " + (json.msg || "未知错误"));
      }
    } catch (e) {
      setMsg("❌ 网络错误");
    }
    setSaving(false);
  };

  if (success) {
    // 八字四柱展示
    const pillars = bazi?.ba_zi || bazi?.eight_characters || null;
    const personality = bazi?.personality || bazi?.pattern || "";

    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-teal/5 to-white flex flex-col items-center justify-center px-6">
        {/* 🎉 庆祝动画 */}
        <div className="relative mb-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-teal/20 rounded-full animate-ping" />
        </div>

        <h1 className="text-lg font-bold text-text-primary mb-1">出生信息已保存！</h1>
        <p className="text-xs text-text-tertiary mb-6 text-center leading-relaxed">
          小章鱼已根据你的生辰信息生成专属命理档案
        </p>

        {/* 八字四柱展示卡 */}
        {pillars && (
          <div className="w-full max-w-xs bg-white rounded-xl shadow-sm border border-brand-teal/10 p-4 mb-4">
            <div className="text-[10px] font-semibold text-text-secondary mb-2 text-center">📜 八字四柱</div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {["年", "月", "日", "时"].map((label, i) => {
                const gan = pillars?.year_stem && i === 0 ? pillars.year_stem + pillars.year_branch
                  : pillars?.month_stem && i === 1 ? pillars.month_stem + pillars.month_branch
                  : pillars?.day_stem && i === 2 ? pillars.day_stem + pillars.day_branch
                  : pillars?.hour_stem && i === 3 ? pillars.hour_stem + pillars.hour_branch
                  : "";
                return (
                  <div key={i} className="bg-brand-teal/5 rounded-lg p-2">
                    <div className="text-[9px] text-text-tertiary mb-1">{label}柱</div>
                    <div className="text-sm font-bold text-brand-teal-dark">{gan || "**"}</div>
                  </div>
                );
              })}
            </div>
            {personality && (
              <div className="mt-2 text-center">
                <span className="text-[10px] text-brand-teal-dark font-medium bg-brand-teal/10 px-2 py-0.5 rounded-full">
                  🏷️ {personality}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 提示 */}
        <p className="text-[10px] text-text-tertiary mb-5 text-center">
          {countdown > 0 ? `${countdown}秒后自动跳转AI会话...` : "正在跳转..."}
        </p>

        <button onClick={() => router.push("/ai")}
          className="w-full max-w-xs rounded-xl py-3 text-sm font-medium text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark active:scale-95 transition-transform shadow-lg shadow-brand-teal/20">
          去AI会话体验专属推演 🚀
        </button>
        <button onClick={() => { setSuccess(false); setDate(""); setBazi(null); }}
          className="block mx-auto mt-3 text-[10px] text-text-tertiary underline">
          重新填写
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-teal/5 to-white">
      <div className="px-5 pt-6 pb-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-text-secondary">←</button>
          <div>
            <h1 className="text-base font-bold text-text-primary">出生信息设置</h1>
            <p className="text-[10px] text-text-tertiary mt-0.5">用于AI专属运势精准推演</p>
          </div>
        </div>

        {/* 阴阳历切换 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
          <label className="text-xs font-medium text-text-primary mb-3 block">日历类型</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button onClick={() => setIsLunar(false)}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${!isLunar ? "bg-brand-teal text-white" : "bg-white text-text-secondary"}`}>
              ☀️ 阳历
            </button>
            <button onClick={() => setIsLunar(true)}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${isLunar ? "bg-brand-teal text-white" : "bg-white text-text-secondary"}`}>
              🌙 阴历
            </button>
          </div>
          <p className="text-[9px] text-text-tertiary mt-1.5">
            {isLunar ? "请选择阴历（农历）出生日期，系统会自动转换为阳历排盘" : "请选择公历出生日期（身份证上的日期）"}
          </p>
        </div>

        {/* 出生日期 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
          <label className="text-xs font-medium text-text-primary mb-2 block">出生日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>

        {/* 出生时辰 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
          <label className="text-xs font-medium text-text-primary mb-3 block">出生时辰</label>
          <div className="grid grid-cols-4 gap-1.5">
            {SHI_CHEN.map(sc => (
              <button key={sc.hour} onClick={() => setHour(sc.hour)}
                className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
                  hour === sc.hour
                    ? "bg-brand-teal text-white shadow-sm"
                    : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                }`}>
                <div>{sc.label}</div>
                <div className="text-[8px] opacity-70">{sc.range}</div>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-text-tertiary mt-1.5">如果不确定时辰，选择&ldquo;午时&rdquo;（11-13点）为默认值</p>
        </div>

        {/* 性别 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
          <label className="text-xs font-medium text-text-primary mb-3 block">性别</label>
          <div className="flex gap-3">
            <button onClick={() => setGender(1)}
              className={`flex-1 py-3 rounded-lg text-xs font-medium transition-all ${gender === 1 ? "bg-brand-teal text-white shadow-sm" : "bg-gray-50 text-text-secondary"}`}>
              🧑 男
            </button>
            <button onClick={() => setGender(0)}
              className={`flex-1 py-3 rounded-lg text-xs font-medium transition-all ${gender === 0 ? "bg-brand-teal text-white shadow-sm" : "bg-gray-50 text-text-secondary"}`}>
              👩 女
            </button>
          </div>
        </div>

        {/* 出生地（经度） */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
          <label className="text-xs font-medium text-text-primary mb-3 block">出生地（用于真太阳时修正）</label>
          <div className="relative">
            <select value={useCustomLongitude ? "__custom__" : city} onChange={e => {
              if (e.target.value === "__custom__") {
                setUseCustomLongitude(true);
              } else {
                setUseCustomLongitude(false);
                setCity(e.target.value);
              }
            }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm appearance-none bg-white">
              {CITIES.map(c => (
                <option key={c.name} value={c.name}>{c.name}（东经{c.longitude}°）</option>
              ))}
              <option value="__custom__">自定义经度</option>
            </select>
          </div>
          {useCustomLongitude && (
            <div className="mt-2">
              <input type="number" step="0.1" value={customLongitude} onChange={e => setCustomLongitude(e.target.value)}
                placeholder="输入经度（如87.6）"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <p className="text-[9px] text-text-tertiary mt-1">东经为正，西经为负。乌鲁木齐约87.6°，默认120°（东八区）</p>
            </div>
          )}
          <p className="text-[9px] text-text-tertiary mt-1.5">真太阳时修正使时辰更精确，相差1°经度差4分钟</p>
        </div>

        {/* 提交 */}
        {msg && (
          <div className={`mb-3 px-3 py-2 rounded-lg text-[11px] text-center font-medium ${
            msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {msg}
          </div>
        )}
        <button onClick={submit} disabled={saving || !date}
          className="w-full rounded-xl py-3 text-sm font-medium text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-brand-teal/20 mb-4">
          {saving ? "保存中..." : "💾 保存出生信息"}
        </button>

        <p className="text-[9px] text-text-tertiary text-center leading-relaxed">
          你的生辰信息仅用于AI运势推演，不会公开显示。
          未满18岁用户请在监护人陪同下使用。
        </p>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
