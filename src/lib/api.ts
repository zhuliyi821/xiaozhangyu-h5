const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surplus.hi.cn";

// ────── Auth API ──────

export interface LoginResult {
  uid: number;
  nickname: string;
  avatar: string;
  token: string;
  balance: {
    credit1: number;
    credit2: number;
    credit3: number;
    credit4: number;
    sim_coin: number;
  };
}

export async function login(mobile: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/member/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, password }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || "登录失败");
  return json.data;
}

export async function register(mobile: string, password: string): Promise<{ uid: number; mobile: string }> {
  const res = await fetch(`${API_BASE}/api/member/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, password }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || json.code === 409 ? "手机号已注册" : "注册失败");
  return json.data;
}

// ────── Referral API ──────

const GUESS_API = `${API_BASE}/addons/guess/api.php`;

export interface ReferralCheckResult {
  referrer_id: number;
  nickname: string;
  reward_desc: string;
}

export async function checkReferral(refUid: number): Promise<ReferralCheckResult> {
  const res = await fetch(`${GUESS_API}?route=guess.referral.check&ref=${refUid}`);
  const json = await res.json();
  if (json.result !== 1) throw new Error(json.msg || "无效推荐码");
  return json.data;
}

export async function claimReferralReward(refCode: number, newUserMobile: string): Promise<void> {
  const res = await fetch(`${GUESS_API}?route=guess.referral.reward`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `ref_code=${refCode}&new_user=${encodeURIComponent(newUserMobile)}`,
  });
  const json = await res.json();
  if (json.result !== 1) throw new Error(json.msg || "推荐奖励发放失败");
}

export interface DrawResult {
  key: string;
  name: string;
  period: number;
  date: string;
  front: string[];
  back: string[];
  pool: string;
  prize1: string;
  sales: string;
}

export interface HistoryItem {
  period: number;
  date: string;
  front: string[];
  back: string[];
}

export interface TrendData {
  periods: number;
  type: string;
  data: { period: number; front: number[]; back: number[] }[];
  hot_front: number[];
  hot_back: number[];
}

export interface CalculateResult {
  type: string;
  front_count: number;
  back_count: number;
  bets: number;
  total_notes: number;
  total_amount: number;
  combinations: string;
}

export interface VerifyResult {
  matched_front: number;
  matched_back: number;
  result: "win" | "lose";
  prize: string;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/lottery-data/${path}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || "API error");
  return json.data as T;
}

/** 供应链 API — 门店商品接口 */
const SUPPLY_API = `${API_BASE}/addons/addon_xiaozhangyu_supply/api.php`;

async function fetchSupplyApi<T>(action: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs = new URLSearchParams();
  qs.set("action", action);
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const res = await fetch(`${SUPPLY_API}?${qs.toString()}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Supply API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || "Supply API error");
  return json.data as T;
}

/** 闲豆置换 API */
const SWAP_API = `${API_BASE}/addons/addon_xiaozhangyu_swap/api.php`;

async function fetchSwapApi<T>(action: string): Promise<T> {
  const res = await fetch(`${SWAP_API}?action=${action}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Swap API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || "Swap API error");
  return json.data as T;
}

export interface StoreProduct {
  id: number;
  product_id: number;
  store_id: number;
  is_listed: number;
  selling_price: string;
  local_stock: number;
  sales_count: number;
  revenue: string;
  name: string;
  brand: string;
  images: string[];
  description: string;
  category_id: number;
  yz_goods_id?: number;
}

export function getStoreProducts(storeId: number = 10001) {
  return fetchSupplyApi<StoreProduct[]>("store.products", { store_id: storeId });
}

export interface SwapProduct {
  id: number;
  product_name: string;
  price: string;
  stock: number;
  max_idle_bean_ratio: string;
  bonus_sim_coin: string;
  product_image: string;
  description: string;
  status: string;
}

export function getSwapProducts() {
  return fetchSwapApi<SwapProduct[]>("zone.products");
}

/* ────── 我的订单 ────── */

export interface OrderItem {
  order_sn: string;
  order_type: string;
  title: string;
  thumb: string;
  price: number;
  quantity: number;
  status: string;
  status_label: string;
  created_at: string;
  paid_at: string;
}

export interface OrdersResponse {
  list: OrderItem[];
  total: number;
  yz_count: number;
  swap_count: number;
  page: number;
  limit: number;
}

export function getMemberOrders(memberId: number, page: number = 1, limit: number = 20) {
  return fetch(`${API_BASE}/api/member/orders?member_id=${memberId}&page=${page}&limit=${limit}`)
    .then(r => r.json())
    .then(j => { if (j.code !== 0) throw new Error(j.msg || "Orders API error"); return j.data as OrdersResponse; });
}

/* ────── 我的收藏 ────── */
export interface FavoriteItem {
  id: number;
  product_id: number;
  product_name: string;
  selling_price: number;
  local_stock: number;
  is_listed: number;
  created_at: string;
}

export function getFavorites(memberId: number) {
  return fetch(`${API_BASE}/api/member/favorites?action=favorites&member_id=${memberId}`)
    .then(r => r.json())
    .then(j => { if (j.code !== 0) throw new Error(j.msg); return j.data as { list: FavoriteItem[]; total: number }; });
}

export function addFavorite(memberId: number, productId: number, productName: string, storeId: number = 10001) {
  return fetch(`${API_BASE}/api/member/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `action=favorites&member_id=${memberId}&product_id=${productId}&product_name=${encodeURIComponent(productName)}&store_id=${storeId}`,
  }).then(r => r.json());
}

export function removeFavorite(memberId: number, id: number) {
  return fetch(`${API_BASE}/api/member/favorites?action=favorites&member_id=${memberId}&id=${id}`, { method: "DELETE" })
    .then(r => r.json());
}

/* ────── 个人资料 ────── */
export interface MemberProfile {
  uid: number;
  nickname: string;
  mobile: string;
  email: string;
  avatar: string;
  assets: {
    credit1: number;        // 积分
    credit2: number;        // 余额
    credit3: number;        // 水晶球(闲豆可用)
    frozen_credit3: number; // 冻结豆
    credit4: number;        // 闲豆
    sim_coin: number;       // 游戏豆
    granted_sim_coin: number; // 授予游戏豆(累计)
  };
}

export function getProfile(memberId: number) {
  return fetch(`${API_BASE}/api/member/profile?action=profile&member_id=${memberId}`)
    .then(r => r.json())
    .then(j => { if (j.code !== 0) throw new Error(j.msg); return j.data as MemberProfile; });
}

export function updateProfile(memberId: number, data: { nickname?: string; email?: string; avatar?: string }) {
  const params = new URLSearchParams({ action: "profile", member_id: String(memberId) });
  if (data.nickname) params.set("nickname", data.nickname);
  if (data.email) params.set("email", data.email);
  if (data.avatar) params.set("avatar", data.avatar);
  return fetch(`${API_BASE}/api/member/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  }).then(r => r.json());
}

export function changePassword(memberId: number, oldPwd: string, newPwd: string) {
  return fetch(`${API_BASE}/api/member/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `action=change_password&member_id=${memberId}&old_password=${encodeURIComponent(oldPwd)}&new_password=${encodeURIComponent(newPwd)}`,
  }).then(r => r.json());
}

/* ────── 卡券包 ────── */
export interface CouponItem {
  id: number;
  coupon_type: string;
  name: string;
  description: string;
  value: number;
  min_amount: number;
  start_at: string;
  end_at: string;
  used: number;
  expired: number;
  source: string;
  created_at: string;
}

export function getCoupons(memberId: number) {
  return fetch(`${API_BASE}/api/member/favorites?action=coupons&member_id=${memberId}`)
    .then(r => r.json())
    .then(j => { if (j.code !== 0) throw new Error(j.msg); return j.data as { list: CouponItem[]; available: number; total: number }; });
}

// ────── Store Services (Decoration Page) ──────

export interface DecorateComponent {
  component_key: string;
  component_title: string;
  remote_data: Record<string, any>;
}

export interface StoreCategory {
  id: number;
  name: string;
}

export interface StoreInfo {
  id: number;
  store_name: string;
  thumb: string;
  address: string;
  lat: string;
  lng: string;
}

export interface StoreProduct {
  id: number;
  title: string;
  price: string;
  thumb: string;
}

export async function getDecoratePage(): Promise<DecorateComponent[]> {
  const r = await fetch(`${API_BASE}/api/store-services?action=page`);
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.msg || "Failed");
  return j.data.components;
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  const r = await fetch(`${API_BASE}/api/store-services?action=categories`);
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.msg || "Failed");
  return j.data;
}

export async function getStoreList(categoryId?: number): Promise<StoreInfo[]> {
  let url = `${API_BASE}/api/store-services?action=stores`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.msg || "Failed");
  return j.data;
}

export async function getStoreProductsList(limit: number = 20): Promise<StoreProduct[]> {
  const r = await fetch(`${API_BASE}/api/store-services?action=products&limit=${limit}`);
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.msg || "Failed");
  return j.data;
}

export interface ProductDetail {
  goods: { id: number; title: string; price: string; thumb: string; stock: number; content: string };
  images: any[];
  specs: any[];
  store_prices: { store_id: number; selling_price: string }[];
}

export async function getProductDetail(goodsId: number): Promise<ProductDetail> {
  const r = await fetch(`${API_BASE}/api/store-services?action=product_detail&goods_id=${goodsId}`);
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.msg || "Failed");
  return j.data;
}

export function getLatestDraws() {
  return fetchApi<DrawResult[]>("latest");
}

export function getHistory(type: string = "dlt", page: number = 1, limit: number = 20) {
  return fetchApi<{ total: number; page: number; limit: number; list: HistoryItem[]; type: string }>(
    `history?type=${type}&page=${page}&limit=${limit}`
  );
}

export function getTrend(type: string = "dlt") {
  return fetchApi<TrendData>(`trend?type=${type}`);
}

export function verifyNumbers(numbers: string) {
  return fetchApi<VerifyResult>(`verify?numbers=${encodeURIComponent(numbers)}`);
}

export function calculate(type: string, front: number, back: number, bets: number = 1) {
  return fetchApi<CalculateResult>(`calculate?type=${type}&front=${front}&back=${back}&bets=${bets}`);
}
