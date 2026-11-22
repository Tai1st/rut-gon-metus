export type Me = { id: string; username: string; fullName?: string; role: "admin" | "user" | "shop" | string };

export type GeoRule = { country: string; region?: string; url: string };
export type DeviceRule = { device: string; url: string };
export type LangRule = { lang: string; url: string };
export type UrlParam = { key: string; value: string };

export type LinkItem = {
  id: string;
  code: string;
  kind: "product" | "campaign" | "url";
  title: string;
  description?: string;
  redirectType?: "direct" | "interstitial";
  note?: string;
  image: string;
  hasPassword?: boolean;
  /** Link thường tạo từ link TikTok: mã của deeplink được tạo kèm (đích của link này). */
  deeplinkCode?: string;
  geoRules?: GeoRule[];
  deviceRules?: DeviceRule[];
  langRules?: LangRule[];
  params?: UrlParam[];
  webUrl: string;
  domain: string;
  clicks: number;
  createdAt: string;
  archivedAt: string | null;
};

export type InspectResult = {
  kind: "product" | "campaign";
  webUrl: string;
  androidUrl: string;
  iosUrl: string;
  title: string;
  image: string;
  productId: string;
  campaignId: string;
};

export type Quota = {
  plan: { code: string; name: string; expiresAt: string | null };
  period: "day" | "week" | "month";
  limit: number | null;
  used: number;
  remaining: number | null;
  /** Gói free đã bị admin tắt và người dùng chưa có gói trả phí còn hạn: không tạo được link mới. */
  disabled?: boolean;
};

export type PricePoint = { months: number; price: number };

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  limit: number;
  period: "day" | "week" | "month";
  prices: PricePoint[];
  currency: string;
  systemDomains: string[];
  maxCustomDomains: number;
  isActive: boolean;
  isRecommended?: boolean;
  /** % giảm khi mua 3 tháng / 1 năm; giá các kỳ này do hệ thống tự tính từ giá 1 tháng. */
  discount3?: number;
  discount12?: number;
  sortOrder: number;
};

export type Payment = {
  configured: boolean;
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrUrl: string | null;
};

export type Order = {
  id: string;
  code: string;
  userId: string;
  planCode: string;
  planName: string;
  months: number;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  paidAt: string | null;
  createdAt: string;
  payment?: Payment | null;
};

export type Domain = {
  id: string;
  host: string;
  kind: "system" | "custom";
  status: "pending" | "active" | "disabled";
  isDefault: boolean;
  /** Cloudflare: nameServers cần đổi; không có Cloudflare: bản ghi TXT xác minh. */
  dns?: { nameServers?: string[]; txt?: { name: string; value: string }; pointTo?: string | null } | null;
};

export type Membership = { id: string; userId: string; planCode: string; expiresAt: string | null };

export const PERIOD_VI = { day: "ngày", week: "tuần", month: "tháng" } as const;
